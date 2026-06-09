import type { VercelRequest, VercelResponse } from '@vercel/node'

function normalizePhone(phone: string): string {
  const clean = phone.trim().replace(/\s/g, '')
  if (clean.startsWith('+')) return clean.replace(/\D/g, '')
  if (clean.startsWith('0')) return '33' + clean.slice(1).replace(/\D/g, '')
  return clean.replace(/\D/g, '')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { orderId, status } = req.body as { orderId: string; status: 'livre' | 'livre_partiel' }
  if (!orderId || !['livre', 'livre_partiel'].includes(status)) {
    return res.status(400).json({ error: 'orderId et status (livre|livre_partiel) requis' })
  }

  const sheetsUrl = process.env.SHEETS_API_URL
  const sheetsSecret = process.env.SHEETS_SECRET
  const resendKey = process.env.RESEND_API_KEY
  const resendFrom = process.env.RESEND_FROM ?? 'SPINCUT <onboarding@resend.dev>'

  if (!sheetsUrl || !sheetsSecret) return res.status(500).json({ error: 'GAS non configuré' })

  try {
    // 1. Récupérer les infos de la commande depuis GAS
    let clientEmail: string | null = null
    let clientPhone: string | null = null
    let commPref = 'email'
    let clientName = ''
    let total = 0

    try {
      const ordersResp = await fetch(`${sheetsUrl}?secret=${encodeURIComponent(sheetsSecret)}&action=orders`)
      if (ordersResp.ok) {
        const orders = await ordersResp.json()
        if (Array.isArray(orders)) {
          const order = orders.find((o: any) => o.uuid === orderId)
          if (order) {
            clientEmail = order.clientEmail || null
            clientPhone = order.clientPhone || null
            commPref = order.commPref || 'email'
            clientName = order.clientName || ''
            total = Number(order.total) || 0
          }
        }
      }
    } catch {}

    // 2. Mettre à jour le statut dans GAS
    const updateResp = await fetch(sheetsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: sheetsSecret, action: 'updateStatus', uuid: orderId, status }),
    })
    if (!updateResp.ok) throw new Error('Impossible de mettre à jour le statut')

    // 3. Notification au client
    let waUrl: string | null = null

    if (commPref === 'whatsapp' && clientPhone) {
      const phone = normalizePhone(clientPhone)
      const firstName = clientName.split(' ')[0] || clientName
      const msg = status === 'livre'
        ? `Bonjour ${firstName} 👋\n\nVotre commande SPINCUT est prête et disponible.\n\nÀ très vite !\nSPINCUT`
        : `Bonjour ${firstName} 👋\n\nUne partie de votre commande SPINCUT est disponible. Les articles restants arriveront prochainement.\n\nÀ très vite !\nSPINCUT`
      waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    } else if (clientEmail && resendKey) {
      const isLivre = status === 'livre'
      const firstName = clientName.split(' ')[0] || clientName
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: resendFrom,
          to: [clientEmail],
          subject: isLivre ? '📦 Votre commande SPINCUT est disponible' : '⚡ Livraison partielle — SPINCUT',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#111;color:#eee;border-radius:12px;padding:24px;">
              <h2 style="color:#d4780f;margin-top:0;">${isLivre ? '✓ Commande disponible' : '⚡ Livraison partielle'}</h2>
              <p>Bonjour ${firstName},</p>
              <p>${isLivre
                ? 'Votre commande est prête. Contactez-nous pour convenir de la livraison ou du retrait.'
                : 'Une partie de votre commande est disponible. Les articles restants arriveront prochainement.'}</p>
              ${total > 0 ? `<p style="color:#888;font-size:13px;">Montant HT : ${total.toFixed(2).replace('.', ',')} €</p>` : ''}
              <p style="margin-top:24px;font-size:12px;color:#666;">L'équipe SPINCUT</p>
            </div>`,
        }),
      }).catch(() => {})
    }

    return res.status(200).json({ ok: true, waUrl })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
  }
}
