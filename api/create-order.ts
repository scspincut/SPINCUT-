import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

function toAscii(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x00-\x7F]/g, '')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientName, items, existingBdcId } = req.body as {
    clientName: string
    items: { ref: string; designation: string; queue: string; quantity: number; price: number; sheet?: string; row?: number }[]
    existingBdcId?: string
  }

  if (!clientName || !items?.length) {
    return res.status(400).json({ error: 'Données manquantes' })
  }

  const apiKey = process.env.ABBY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY non configurée' })

  try {
    const abby = new Abby(apiKey)

    // 1 — Chercher le contact existant par nom
    const { data: contacts } = await abby.contact.retrieveContacts({
      query: { search: clientName, limit: 5 },
    })
    const contact = contacts?.docs?.[0]
    if (!contact) {
      return res.status(400).json({ error: 'Compte client introuvable dans Abby. Contactez SPINCUT pour créer votre compte.' })
    }

    const newLines = items.map(item => ({
      designation: toAscii(item.queue ? `${item.designation} - Queue ${item.queue}` : item.designation),
      reference: item.ref,
      unitPrice: Math.round(item.price * 100),
      quantity: item.quantity,
      quantityUnit: 'unit' as const,
    }))

    let orderId: string | null = null
    let isNewBdc = false

    // 2 — Si un BDC ouvert est fourni, essayer de l'enrichir
    if (existingBdcId) {
      try {
        const { data: existingBdc } = await abby.billing.getBillingById({
          path: { billingId: existingBdcId },
        })
        const bdc = existingBdc as any
        if (bdc && bdc.state === 'draft' && bdc.isEditable) {
          const existingLines = (bdc.lines ?? []).map((l: any) => ({
            designation: l.designation,
            reference: l.reference,
            unitPrice: l.unitPrice,
            quantity: l.quantity ?? 1,
            quantityUnit: (l.quantityUnit ?? 'unit') as 'unit',
          }))
          await (abby.billing.updateLines as any)({
            path: { billingId: existingBdcId },
            body: { lines: [...existingLines, ...newLines] },
          })
          orderId = existingBdcId
        }
      } catch {
        // BDC introuvable ou expiré — on crée un nouveau
      }
    }

    // 3 — Créer un nouveau BDC si nécessaire
    if (!orderId) {
      const { data: order } = await abby.estimate.createEstimateByContactOrOrganizationId({
        path: { customerId: contact.id },
        body: { estimateType: 'purchase_order' },
      })
      if (order?.id) {
        orderId = order.id
        isNewBdc = true
        await (abby.billing.updateLines as any)({
          path: { billingId: order.id },
          body: { lines: newLines },
        })
      }
    }

    // 4 — Déduire le stock uniquement si le BDC est validé
    const sheetsUrl = process.env.SHEETS_API_URL
    const sheetsSecret = process.env.SHEETS_SECRET
    if (orderId && sheetsUrl && sheetsSecret) {
      const updates = items
        .filter(item => item.sheet && item.row)
        .map(item => ({ sheet: item.sheet, row: item.row, qty: item.quantity }))
      if (updates.length > 0) {
        fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: sheetsSecret, updates }),
        }).catch(() => {})
      }
    }

    // 5 — Notification ntfy.sh
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const lignes = items.map(i => `${i.quantity}x ${i.ref} (${i.price.toFixed(2)}EUR)`).join(' | ')
    const ntfyMsg = `Client : ${clientName}\n${lignes}\nTotal ajout : ${total.toFixed(2)} EUR HT\nBDC : ${orderId}${!isNewBdc ? ' (enrichi)' : ' (nouveau)'}`
    fetch('https://ntfy.sh/spincut-commandes-7x4k9', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'Title': 'Nouvelle commande SPINCUT', 'Priority': 'high', 'Tags': 'shopping,fr' },
      body: ntfyMsg,
    }).catch(() => {})

    return res.status(200).json({ success: true, orderId, isNewBdc })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return res.status(500).json({ error: `Erreur Abby : ${msg}` })
  }
}
