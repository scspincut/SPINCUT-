import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientName, items } = req.body as {
    clientName: string
    items: { ref: string; designation: string; queue: string; quantity: number; price: number; sheet?: string; row?: number }[]
  }

  if (!clientName || !items?.length) {
    return res.status(400).json({ error: 'Données manquantes' })
  }

  const apiKey = process.env.ABBY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY non configurée' })

  try {
    const abby = new Abby(apiKey)

    // 1 — Chercher le contact existant par nom de société
    const { data: contacts } = await abby.contact.retrieveContacts({
      query: { search: clientName, limit: 5 },
    })

    const contact = contacts?.docs?.[0]
    if (!contact) {
      return res.status(400).json({ error: 'Compte client introuvable dans Abby. Contactez SPINCUT pour créer votre compte.' })
    }

    let orderId: string | null = null

    // 2 — Créer le bon de commande pour ce contact
    const { data: order } = await abby.estimate.createEstimateByContactOrOrganizationId({
      path: { customerId: contact.id },
      body: { estimateType: 'purchase_order' },
    })

    if (order?.id) {
      orderId = order.id

      // 3 — Ajouter les lignes produits (désignation ASCII uniquement)
      await abby.billing.updateLines({
        path: { billingId: order.id },
        body: {
          lines: items.map(item => ({
            designation: (item.queue
              ? `${item.designation} - Queue ${item.queue}`
              : item.designation
            ).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x00-\x7F]/g, ''),
            reference: item.ref,
            unitPrice: Math.round(item.price * 100),
            quantity: item.quantity,
            quantityUnit: 'unit' as const,
          })),
        },
      })
    }

    // 4 — Déduire le stock uniquement si la commande Abby a été créée
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

    // 5 — Notification push via ntfy.sh (non bloquant, sans clé API)
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const lignes = items
      .map(i => `${i.quantity}x ${i.ref} (${i.price.toFixed(2)}EUR)`)
      .join(' | ')
    const ntfyMsg = `Client : ${clientName}\n${lignes}\nTotal : ${total.toFixed(2)} EUR HT${orderId ? `\nBDC : ${orderId}` : ''}`

    fetch('https://ntfy.sh/spincut-commandes-7x4k9', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Title': `Nouvelle commande SPINCUT`,
        'Priority': 'high',
        'Tags': 'shopping,fr',
      },
      body: ntfyMsg,
    }).catch(() => {})

    return res.status(200).json({ success: true, orderId })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return res.status(500).json({ error: `Erreur Abby : ${msg}` })
  }
}
