import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

const STATE_LABEL: Record<string, string> = {
  draft:     'Brouillon',
  finalized: 'En attente',
  signed:    'Accepté',
  refused:   'Refusé',
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

  // ── 1. Commandes en cours ─────────────────────────────────────────────────
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

  // ── 2. Factures à régler ──────────────────────────────────────────────────
  const invoices: {
    id: string; number: string; state: string; label: string
    amount: number; dueAt?: number
  }[] = []

  try {
    // Find contact/org to get the customer ID
    const [contactsRes, orgsRes] = await Promise.allSettled([
      abby.contact.retrieveContacts({ query: { search: clientName, limit: 5, page: 1 } }),
      abby.organization.retrieveOrganizations({ query: { search: clientName, limit: 5, page: 1 } as any }),
    ])

    const contact = contactsRes.status === 'fulfilled' ? contactsRes.value.data?.docs?.[0] : undefined
    const org = orgsRes.status === 'fulfilled' ? (orgsRes.value.data as any)?.docs?.[0] : undefined
    const customerId = contact?.id ?? org?.id

    if (customerId) {
      // Try to list invoices via the REST API directly
      const resp = await fetch(
        `https://api.app-abby.com/v2/billings?type=invoice&customerId=${customerId}&limit=50&page=1`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      )
      if (resp.ok) {
        const data = await resp.json() as any
        const docs: any[] = data?.docs ?? data?.data ?? data?.billings ?? []
        for (const inv of docs) {
          if (['paid', 'archived'].includes(inv.state)) continue
          invoices.push({
            id: inv.id,
            number: inv.number ?? '',
            state: inv.state ?? 'finalized',
            label: STATE_LABEL[inv.state] ?? 'À régler',
            amount: (inv.total?.amountWithTaxAfterDiscount ?? inv.totalIncludingTaxes ?? 0) / 100,
            dueAt: inv.dueAt,
          })
        }
      }
    }
  } catch {}

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ orders, invoices })
}
