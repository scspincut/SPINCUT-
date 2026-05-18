import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientName, items } = req.body as {
    clientName: string
    items: { ref: string; designation: string; queue: string; quantity: number; price: number }[]
  }

  if (!clientName || !items?.length) {
    return res.status(400).json({ error: 'Missing clientName or items' })
  }

  const apiKey = process.env.ABBY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY not configured' })

  const abby = new Abby(apiKey)

  // 1 — Créer le contact client
  const nameParts = clientName.trim().split(/\s+/)
  const firstname = nameParts[0] ?? 'Client'
  const lastname = nameParts.slice(1).join(' ') || 'SPINCUT'

  const { data: contact } = await abby.contact.createContact({
    body: { firstname, lastname, notes: 'Commande via SPINCUT App' },
  })

  // 2 — Créer le devis pour ce contact
  const { data: estimate } = await abby.estimate.createEstimateByContactOrOrganizationId({
    path: { customerId: contact.id },
    body: {},
  })

  // 3 — Ajouter les lignes produits
  await abby.billing.updateLines({
    path: { billingId: estimate.id },
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

  return res.status(200).json({ success: true, estimateId: estimate.id })
}
