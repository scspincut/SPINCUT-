import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

function serializeError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try { return JSON.stringify(err) } catch { return String(err) }
}

function normalizePhone(phone: string): string {
  const clean = (phone || '').trim().replace(/\s/g, '')
  if (clean.startsWith('+')) return clean.replace(/\D/g, '')
  if (clean.startsWith('0')) return '33' + clean.slice(1).replace(/\D/g, '')
  return clean.replace(/\D/g, '')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientName, clientCode, commPref, items, existingBdcId, testMode } = req.body as {
    clientName: string
    clientCode?: string
    commPref?: string
    items: { ref: string; designation: string; queue: string; quantity: number; price: number; sheet?: string; row?: number }[]
    existingBdcId?: string
    testMode?: boolean
  }

  if (!clientName || !items?.length) {
    return res.status(400).json({ error: 'Données manquantes' })
  }

  // Mode test : email uniquement, sans BDC Abby
  if (testMode) {
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const resendKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM ?? 'SPINCUT <onboarding@resend.dev>'
    if (!resendKey) {
      return res.status(200).json({ success: true, orderId: 'TEST-0000', isNewBdc: true, emailStatus: 'RESEND_API_KEY manquante' })
    }
    const lignesHtml = items.map(i =>
      `<tr><td style="padding:4px 8px;border-bottom:1px solid #222;">${i.quantity}×</td><td style="padding:4px 8px;border-bottom:1px solid #222;">${i.ref}</td><td style="padding:4px 8px;border-bottom:1px solid #222;">${i.designation}</td><td style="padding:4px 8px;border-bottom:1px solid #222;text-align:right;">${(i.price * i.quantity).toFixed(2)} €</td></tr>`
    ).join('')
    let emailStatus = 'ok'
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: ['scspincut@gmail.com'],
          subject: `🧪 [TEST] Commande — ${clientName}`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#111;color:#eee;border-radius:12px;padding:24px;"><p style="background:#2a1400;color:#d4780f;padding:8px 12px;border-radius:6px;font-size:12px;">⚠️ Email de test — aucun BDC créé dans Abby</p><h2 style="color:#d4780f;margin-top:16px;">Commande TEST SPINCUT</h2><p><strong>Client :</strong> ${clientName}</p><table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="color:#888;font-size:12px;"><th style="text-align:left;padding:4px 8px;">Qté</th><th style="text-align:left;padding:4px 8px;">Réf</th><th style="text-align:left;padding:4px 8px;">Désignation</th><th style="text-align:right;padding:4px 8px;">Montant</th></tr></thead><tbody>${lignesHtml}</tbody></table><p style="text-align:right;font-size:16px;"><strong>Total HT : ${total.toFixed(2)} €</strong></p></div>`,
        }),
      })
      if (!emailRes.ok) {
        const errBody = await emailRes.json().catch(() => ({}))
        emailStatus = `Resend ${emailRes.status}: ${JSON.stringify(errBody)}`
      }
    } catch (e) {
      emailStatus = `fetch error: ${e instanceof Error ? e.message : String(e)}`
    }
    return res.status(200).json({ success: true, orderId: 'TEST-0000', isNewBdc: true, emailStatus, blNumber: 'BL-TEST-001' })
  }

  const apiKey = process.env.ABBY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY non configurée' })

  const sheetsUrl = process.env.SHEETS_API_URL
  const sheetsSecret = process.env.SHEETS_SECRET
  const resendKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM ?? 'SPINCUT <onboarding@resend.dev>'

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const lignesHtml = items.map(i =>
    `<tr><td style="padding:4px 8px;border-bottom:1px solid #222;">${i.quantity}×</td><td style="padding:4px 8px;border-bottom:1px solid #222;">${i.ref}</td><td style="padding:4px 8px;border-bottom:1px solid #222;">${i.designation}</td><td style="padding:4px 8px;border-bottom:1px solid #222;text-align:right;">${(i.price * i.quantity).toFixed(2)} €</td></tr>`
  ).join('')

  let step = 'initialisation'
  try {
    const abby = new Abby(apiKey)

    // 1 — Chercher le contact existant par nom
    step = 'recherche contact'
    const { data: contacts } = await abby.contact.retrieveContacts({
      query: { search: clientName, limit: 5, page: 1 },
    })
    const contact = contacts?.docs?.[0] as any
    if (!contact) {
      return res.status(400).json({ error: 'Compte client introuvable dans Abby. Contactez SPINCUT pour créer votre compte.' })
    }

    // Extraire email et téléphone Abby du contact
    const clientEmail: string | null = contact?.emails?.[0]?.email ?? null
    const clientPhone: string | null = contact?.phone ?? null

    const newLines = items.map(item => ({
      designation: item.queue ? `${item.designation} - Queue ${item.queue}` : item.designation,
      reference: item.ref,
      unitPrice: Math.round(item.price * 100),
      quantity: item.quantity,
      quantityUnit: 'unit' as const,
      type: 'sale_of_goods' as const,
      vatCode: 'FR_2000' as const,
    }))

    let orderId: string | null = null
    let isNewBdc = false

    // 2 — Si un BDC ouvert est fourni, essayer de l'enrichir
    if (existingBdcId) {
      try {
        step = 'récupération BDC existant'
        const { data: existingBdc } = await abby.billing.getBillingById({
          path: { documentId: existingBdcId },
        })
        const bdc = existingBdc as any
        const OPEN_STATES = new Set(['draft', 'finalized', 'sent', 'signed'])
        const isOpen = bdc && OPEN_STATES.has(bdc.state)
        if (isOpen) {
          step = 'mise à jour lignes BDC existant'
          const existingLines = (bdc.lines ?? []).map((l: any) => ({
            designation: l.designation,
            reference: l.reference,
            unitPrice: l.unitPrice,
            quantity: l.quantity ?? 1,
            quantityUnit: (l.quantityUnit ?? 'unit') as 'unit',
            type: (l.type ?? 'sale_of_goods') as 'sale_of_goods',
            vatCode: (l.vatCode ?? 'FR_2000') as 'FR_2000',
          }))
          await (abby.billing.updateLines as any)({
            path: { billingId: existingBdcId },
            body: { lines: [...existingLines, ...newLines] },
          })
          orderId = existingBdcId
        }
      } catch {
        // BDC introuvable ou expiré — on crée un nouveau
        orderId = null
      }
    }

    // 3 — Créer un nouveau BDC si nécessaire
    if (!orderId) {
      step = 'création bon de commande'
      const { data: order } = await abby.estimate.createEstimateByContactOrOrganizationId({
        path: { customerId: contact.id },
        body: { estimateType: 'purchase_order' },
      })
      if (!order?.id) {
        return res.status(500).json({ error: 'Abby n\'a pas retourné d\'identifiant de bon de commande' })
      }
      orderId = order.id
      isNewBdc = true
      step = 'ajout lignes nouveau BDC'
      await (abby.billing.updateLines as any)({
        path: { billingId: order.id },
        body: { lines: newLines },
      })
    }

    // 4 — Déduire le stock
    if (orderId && sheetsUrl && sheetsSecret) {
      const updates = items
        .filter(item => item.sheet && item.row)
        .map(item => ({ sheet: item.sheet, row: item.row, qty: item.quantity }))
      if (updates.length > 0) {
        await fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: sheetsSecret, updates }),
        }).catch(() => {})
      }
    }

    // 4b — Numéro BL + log dans GAS (pour chaque commande/livraison)
    let blNumber = ''
    if (orderId && sheetsUrl && sheetsSecret) {
      try {
        const itemsSummary = items.map(i => ({ ref: i.ref, qty: i.quantity }))
        const gasResp = await fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: sheetsSecret,
            action: 'logOrder',
            order: {
              uuid: orderId,
              clientName,
              clientCode: clientCode ?? '',
              date: Date.now(),
              items: JSON.stringify(itemsSummary),
              total,
              clientEmail: clientEmail ?? '',
              clientPhone: clientPhone ?? '',
              commPref: commPref ?? 'email',
              isNewBdc,
            },
          }),
        })
        if (gasResp.ok) {
          const gasData = await gasResp.json().catch(() => null)
          if (gasData?.blNumber) blNumber = gasData.blNumber
        }
      } catch {}
    }
    // Fallback si GAS ne retourne pas encore de numéro BL
    if (!blNumber) {
      const d = new Date()
      blNumber = `BL-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-4)}`
    }

    // 5 — Email de notification admin via Resend
    if (resendKey) {
      const clientCommPref = commPref ?? 'email'
      const waSection = clientCommPref === 'whatsapp' && clientPhone
        ? `<p style="margin-top:16px;"><a href="https://wa.me/${normalizePhone(clientPhone)}?text=${encodeURIComponent(`Bonjour, votre commande SPINCUT est bien reçue ! Nous vous informerons dès qu'elle sera prête. 🛒`)}" style="display:inline-block;padding:10px 16px;background:#25d366;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold;">✓ Confirmer au client par WhatsApp</a></p>`
        : ''

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: ['scspincut@gmail.com'],
          subject: `🛒 Nouvelle commande — ${clientName}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#111;color:#eee;border-radius:12px;padding:24px;">
              <h2 style="color:#d4780f;margin-top:0;">Nouvelle commande SPINCUT</h2>
              <p><strong>Client :</strong> ${clientName}</p>
              <p><strong>BL :</strong> <span style="color:#d4780f;font-family:monospace;">${blNumber}</span></p>
              <p><strong>BDC :</strong> ${orderId} ${isNewBdc ? '(nouveau)' : '(enrichi)'}</p>
              ${clientCommPref === 'whatsapp' ? '<p style="color:#fbbf24;font-size:12px;">📱 Ce client préfère être contacté par WhatsApp</p>' : ''}
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <thead><tr style="color:#888;font-size:12px;">
                  <th style="text-align:left;padding:4px 8px;">Qté</th>
                  <th style="text-align:left;padding:4px 8px;">Réf</th>
                  <th style="text-align:left;padding:4px 8px;">Désignation</th>
                  <th style="text-align:right;padding:4px 8px;">Montant</th>
                </tr></thead>
                <tbody>${lignesHtml}</tbody>
              </table>
              <p style="text-align:right;font-size:16px;"><strong>Total HT : ${total.toFixed(2)} €</strong></p>
              <p style="text-align:right;font-size:13px;color:#888;">Total TTC : ${(total * 1.2).toFixed(2)} €</p>
              ${waSection}
            </div>`,
        }),
      }).catch(() => {})
    }

    // 5b — Confirmation email au client (si commPref = email)
    if ((commPref ?? 'email') === 'email' && clientEmail && resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [clientEmail],
          subject: `✅ Commande reçue — SPINCUT`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#111;color:#eee;border-radius:12px;padding:24px;">
              <h2 style="color:#d4780f;margin-top:0;">Commande bien reçue ✓</h2>
              <p>Bonjour ${clientName.split(' ')[0] || clientName},</p>
              <p>Votre commande a bien été reçue. Nous vous informerons dès qu'elle sera disponible.</p>
              <p style="margin-top:12px;">Référence de livraison : <strong style="color:#d4780f;font-family:monospace;">${blNumber}</strong></p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <thead><tr style="color:#888;font-size:12px;">
                  <th style="text-align:left;padding:4px 8px;">Qté</th>
                  <th style="text-align:left;padding:4px 8px;">Réf</th>
                  <th style="text-align:left;padding:4px 8px;">Désignation</th>
                  <th style="text-align:right;padding:4px 8px;">Montant</th>
                </tr></thead>
                <tbody>${lignesHtml}</tbody>
              </table>
              <p style="text-align:right;font-size:16px;"><strong>Total HT : ${total.toFixed(2)} €</strong></p>
              <p style="text-align:right;font-size:13px;color:#888;">Total TTC : ${(total * 1.2).toFixed(2)} €</p>
              <p style="margin-top:24px;font-size:12px;color:#666;">L'équipe SPINCUT</p>
            </div>`,
        }),
      }).catch(() => {})
    }

    return res.status(200).json({ success: true, orderId, isNewBdc, blNumber })

  } catch (err: unknown) {
    return res.status(500).json({ error: `Erreur Abby (${step}) : ${serializeError(err)}` })
  }
}
