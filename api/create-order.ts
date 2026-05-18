import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientName, items } = req.body as {
    clientName: string
    items: { ref: string; designation: string; queue: string; quantity: number; price: number }[]
  }

  if (!clientName || !items?.length) {
    return res.status(400).json({ error: 'Données manquantes' })
  }

  const apiKey = process.env.ABBY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY non configurée' })

  const abby = new Abby(apiKey)

  // 1 — Chercher le contact existant par nom de société
  const { data: contacts } = await abby.contact.retrieveContacts({
    query: { search: clientName, limit: 5 },
  })

  const contact = contacts?.docs?.[0]

  if (!contact) {
    return res.status(404).json({
      error: `Client "${clientName}" introuvable dans Abby — vérifiez que la fiche existe.`,
    })
  }

  // 2 — Créer le bon de commande pour ce contact
  const { data: order } = await abby.estimate.createEstimateByContactOrOrganizationId({
    path: { customerId: contact.id },
    body: { estimateType: 'purchase_order' },
  })

  // 3 — Ajouter les lignes produits
  await abby.billing.updateLines({
    path: { billingId: order.id },
    body: {
      lines: items.map(item => ({
        designation: `${item.designation} — Queue ${item.queue}`,
        reference: item.ref,
        unitPrice: Math.round(item.price * 100), // centimes
        quantity: item.quantity,
        quantityUnit: 'unit' as const,
      })),
    },
  })

  return res.status(200).json({ success: true, orderId: order.id })
}
