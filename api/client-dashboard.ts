import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

const STATE_LABEL: Record<string, string> = {
  draft:     'Brouillon',
  finalized: 'En attente',
  sent:      'Envoyée',
  signed:    'Acceptée',
  refused:   'Refusée',
  invoiced:  'Facturée',
  delivered: 'Livrée',
  paid:      'Payé',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientName, orderIds } = req.body as {
    clientName: string
    orderIds?: string[]
  }

  if (!clientName) return res.status(400).json({ error: 'clientName requis' })

  const apiKey = process.env.ABBY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY non configurée' })

  const abby = new Abby(apiKey)

  const orders: {
    id: string; number: string; state: string; label: string
    total: number; date: number; items: { ref: string; designation: string; qty: number }[]
  }[] = []

  if (orderIds && orderIds.length > 0) {
    const uniqueIds = [...new Set(orderIds)].slice(0, 15)
    await Promise.allSettled(
      uniqueIds.map(async id => {
        try {
          const { data: bdc } = await abby.billing.getBillingById({ path: { billingId: id } })
          const b = bdc as any
          const state: string = b.state ?? 'unknown'
          if (['paid', 'cancelled', 'archived'].includes(state)) return
          orders.push({
            id,
            number: b.number ?? '',
            state,
            label: STATE_LABEL[state] ?? state,
            total: (b.total?.amountWithoutTaxAfterDiscount ?? 0) / 100,
            date: b.emittedAt ?? b.createdAt ?? 0,
            items: (b.lines ?? []).slice(0, 3).map((l: any) => ({
              ref: l.reference ?? '',
              designation: l.designation ?? '',
              qty: l.quantity ?? 1,
            })),
          })
        } catch {}
      })
    )
  }

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ orders })
}
