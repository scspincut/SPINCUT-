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
  paid:      'Payée',
}

const DELIVERED_STATES = new Set(['invoiced', 'delivered', 'paid'])
const HIDDEN_STATES    = new Set(['cancelled', 'archived'])

type OrderEntry = {
  id: string; number: string; state: string; label: string
  total: number; date: number; items: { ref: string; designation: string; qty: number }[]
  deliveryStatus?: 'livre' | 'livre_partiel'
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

  const pending: OrderEntry[]   = []
  const delivered: OrderEntry[] = []

  if (orderIds && orderIds.length > 0) {
    const uniqueIds = [...new Set(orderIds)].slice(0, 20)
    await Promise.allSettled(
      uniqueIds.map(async id => {
        try {
          const { data: bdc } = await abby.billing.getBillingById({ path: { documentId: id } })
          const b = bdc as any
          const state: string = b.state ?? 'unknown'
          if (HIDDEN_STATES.has(state)) return
          const entry: OrderEntry = {
            id,
            number: b.number ?? '',
            state,
            label: STATE_LABEL[state] ?? state,
            total: (b.total?.amountWithoutTaxAfterDiscount ?? 0) / 100,
            date: b.emittedAt ?? b.createdAt ?? 0,
            items: (b.lines ?? []).slice(0, 5).map((l: any) => ({
              ref: l.reference ?? '',
              designation: l.designation ?? '',
              qty: l.quantity ?? 1,
            })),
          }
          if (DELIVERED_STATES.has(state)) {
            delivered.push(entry)
          } else {
            pending.push(entry)
          }
        } catch {}
      })
    )
  }

  // Enrichir avec le statut GAS (livré / livré partiellement marqué par admin)
  const sheetsUrl = process.env.SHEETS_API_URL
  const sheetsSecret = process.env.SHEETS_SECRET
  if (sheetsUrl && sheetsSecret) {
    try {
      const gasResp = await fetch(
        `${sheetsUrl}?secret=${encodeURIComponent(sheetsSecret)}&action=orders&clientName=${encodeURIComponent(clientName)}`
      )
      if (gasResp.ok) {
        const gasOrders = await gasResp.json()
        if (Array.isArray(gasOrders)) {
          const gasMap = new Map<string, string>(gasOrders.map((o: any) => [String(o.uuid), String(o.status || 'en_cours')]))

          // Déplacer vers "livré" si GAS dit 'livre'
          const toMove: string[] = []
          for (const order of pending) {
            const gs = gasMap.get(order.id)
            if (gs === 'livre') {
              order.deliveryStatus = 'livre'
              order.label = 'Livré'
              delivered.push(order)
              toMove.push(order.id)
            } else if (gs === 'livre_partiel') {
              order.deliveryStatus = 'livre_partiel'
            }
          }
          // Retirer du pending ceux qui sont livrés
          for (const id of toMove) {
            const idx = pending.findIndex(o => o.id === id)
            if (idx !== -1) pending.splice(idx, 1)
          }
        }
      }
    } catch {}
  }

  // Tri par date décroissante
  const byDate = (a: OrderEntry, b: OrderEntry) => b.date - a.date
  pending.sort(byDate)
  delivered.sort(byDate)

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ orders: pending, delivered })
}
