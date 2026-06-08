import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'


function serializeError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try { return JSON.stringify(err) } catch { return String(err) }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientName, items, existingBdcId, testMode } = req.body as {
    clientName: string
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
    return res.status(200).json({ success: true, orderId: 'TEST-0000', isNewBdc: true, emailStatus })
  }

  const apiKey = process.env.ABBY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY non configurée' })

  let step = 'initialisation'
  try {
    const abby = new Abby(apiKey)

    // 1 — Chercher le contact existant par nom
    step = 'recherche contact'
    const { data: contacts } = await abby.contact.retrieveContacts({
      query: { search: clientName, limit: 5, page: 1 },
    })
    const contact = contacts?.docs?.[0]
    if (!contact) {
      return res.status(400).json({ error: 'Compte client introuvable dans Abby. Contactez SPINCUT pour créer votre compte.' })
    }

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
          path: { billingId: existingBdcId },
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
    const sheetsUrl = process.env.SHEETS_API_URL
    const sheetsSecret = process.env.SHEETS_SECRET
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

    // 5 — Email de notification via Resend
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const lignesHtml = items.map(i =>
        `<tr><td style="padding:4px 8px;border-bottom:1px solid #222;">${i.quantity}×</td><td style="padding:4px 8px;border-bottom:1px solid #222;">${i.ref}</td><td style="padding:4px 8px;border-bottom:1px solid #222;">${i.designation}</td><td style="padding:4px 8px;border-bottom:1px solid #222;text-align:right;">${(i.price * i.quantity).toFixed(2)} €</td></tr>`
      ).join('')
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'SPINCUT <onboarding@resend.dev>',
          to: ['scspincut@gmail.com'],
          subject: `🛒 Nouvelle commande — ${clientName}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#111;color:#eee;border-radius:12px;padding:24px;">
              <h2 style="color:#d4780f;margin-top:0;">Nouvelle commande SPINCUT</h2>
              <p><strong>Client :</strong> ${clientName}</p>
              <p><strong>BDC :</strong> ${orderId} ${isNewBdc ? '(nouveau)' : '(enrichi)'}</p>
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
            </div>`,
        }),
      }).catch(() => {})
    }

    return res.status(200).json({ success: true, orderId, isNewBdc })

  } catch (err: unknown) {
    return res.status(500).json({ error: `Erreur Abby (${step}) : ${serializeError(err)}` })
  }
}
