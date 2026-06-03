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

async function fetchAbby(url: string, apiKey: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
  if (!r.ok) return null
  return r.json().catch(() => null)
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
  const BASE = 'https://api.app-abby.com'

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
          // Include purchase orders not yet fully settled
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
    // Find contact and its embedded org ID
    const { data: contacts } = await abby.contact.retrieveContacts({
      query: { search: clientName, limit: 5, page: 1 },
    })
    const contact = contacts?.docs?.[0]
    const contactId = contact?.id
    const embeddedOrgId = (contact as any)?.organization?.id

    // Also search orgs by name
    let orgId = embeddedOrgId
    if (!orgId) {
      try {
        const { data: orgs } = await abby.organization.retrieveOrganizations({
          query: { search: clientName, limit: 5, page: 1 },
        })
        orgId = orgs?.docs?.[0]?.id ?? null
      } catch {}
    }

    // Try every plausible Abby endpoint for listing invoices.
    // Abby doesn't expose this in their SDK so we probe known patterns.
    const idsToTry = [...new Set([orgId, contactId].filter(Boolean))] as string[]
    const endpoints = idsToTry.flatMap(id => [
      `${BASE}/v2/billings?type=invoice&contactId=${id}&page=1&limit=50`,
      `${BASE}/v2/billings?billingType=invoice&contactId=${id}&page=1&limit=50`,
      `${BASE}/v2/billings?contactId=${id}&page=1&limit=50`,
      `${BASE}/billings?type=invoice&contactId=${id}&page=1&limit=50`,
      `${BASE}/v2/billing?type=invoice&contactId=${id}&page=1&limit=50`,
    ])

    for (const url of endpoints) {
      const data = await fetchAbby(url, apiKey)
      if (!data) continue
      const docs: any[] = data?.docs ?? data?.data ?? data?.billings ?? (Array.isArray(data) ? data : [])
      if (!docs.length) continue
      for (const inv of docs) {
        // Only show unpaid invoices
        if (['paid', 'archived'].includes(inv.state ?? inv.billingState)) continue
        const billingType = inv.type ?? inv.billingType ?? ''
        if (billingType && billingType !== 'invoice') continue
        invoices.push({
          id: inv.id,
          number: inv.number ?? '',
          state: inv.state ?? inv.billingState ?? 'finalized',
          label: STATE_LABEL[inv.state ?? inv.billingState] ?? 'À régler',
          amount: (inv.total?.amountWithTaxAfterDiscount ?? inv.amount ?? 0) / 100,
          dueAt: inv.dueAt ?? inv.dueDate,
        })
      }
      if (invoices.length > 0) break
    }
  } catch {}

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ orders, invoices })
}
