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

async function fetchAbbyPath(abby: any, path: string) {
  try {
    const result = await abby.getClient().get({ url: path, throwOnError: false })
    return result?.data ?? {}
  } catch (e: any) {
    return { _status: e?.status ?? 'thrown', _error: String(e).slice(0, 200) }
  }
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

  // Debug collector
  const _debug: any = { clientName, contactId: null, orgId: null, probes: [] }

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
    // Find contact + org IDs
    let contactId: string | null = null
    let orgId: string | null = null

    try {
      const { data: contacts } = await abby.contact.retrieveContacts({
        query: { search: clientName, limit: 5, page: 1 },
      })
      const contact = contacts?.docs?.[0]
      contactId = contact?.id ?? null
      orgId = (contact as any)?.organization?.id ?? null
      _debug.contactId = contactId
      _debug.contactName = contact ? `${contact.firstname} ${contact.lastname}` : null
      _debug.orgIdFromContact = orgId
    } catch (e) { _debug.contactError = String(e) }

    if (!orgId) {
      try {
        const { data: orgs } = await abby.organization.retrieveOrganizations({
          query: { search: clientName, limit: 5, page: 1 },
        })
        orgId = orgs?.docs?.[0]?.id ?? null
        _debug.orgId = orgId
        _debug.orgName = (orgs?.docs?.[0] as any)?.name ?? null
      } catch (e) { _debug.orgError = String(e) }
    }

    // ── Strategy A: SDK invoice service (if list method exists) ──
    try {
      const inv = abby as any
      if (typeof inv.invoice?.retrieveInvoices === 'function') {
        const r = await inv.invoice.retrieveInvoices({ query: { limit: 50, page: 1 } })
        _debug.probes.push({ src: 'sdk.invoice.retrieveInvoices', keys: Object.keys(r?.data ?? {}) })
        const docs: any[] = r?.data?.docs ?? r?.data?.data ?? (Array.isArray(r?.data) ? r.data : [])
        _debug.probes[_debug.probes.length - 1].count = docs.length
        processInvoiceDocs(docs, clientName, contactId, orgId, invoices)
      } else {
        _debug.probes.push({ src: 'sdk.invoice.retrieveInvoices', skip: 'method not found' })
      }
    } catch (e) { _debug.probes.push({ src: 'sdk.invoice.retrieveInvoices', error: String(e) }) }

    // ── Strategy B: list all invoices via SDK client (proper auth headers) ──
    if (invoices.length === 0) {
      const pathsToTry = [
        '/v2/billing/invoice?page=1&limit=100',
        '/v2/billing?type=invoice&page=1&limit=100',
        '/v2/billing?billingType=invoice&page=1&limit=100',
      ]
      for (const path of pathsToTry) {
        const data = await fetchAbbyPath(abby, path)
        const docs: any[] = data?.docs ?? data?.data ?? data?.billings ?? (Array.isArray(data) ? data : [])
        _debug.probes.push({ src: path, status: data?._status, count: docs.length, rawKeys: data ? Object.keys(data).slice(0, 8) : null })
        if (docs.length > 0) {
          processInvoiceDocs(docs, clientName, contactId, orgId, invoices)
          if (invoices.length > 0) break
        }
      }
    }

    // ── Strategy C: filter by contact/org ID (query param) ──
    if (invoices.length === 0) {
      const ids = [...new Set([orgId, contactId].filter(Boolean))] as string[]
      for (const id of ids) {
        const pathsToTry = [
          `/v2/billing/invoice?contactId=${id}&page=1&limit=50`,
          `/v2/billing/invoice?customerId=${id}&page=1&limit=50`,
          `/v2/billing/invoice?organizationId=${id}&page=1&limit=50`,
          `/v2/billing?type=invoice&contactId=${id}&page=1&limit=50`,
          `/v2/billing?contactId=${id}&page=1&limit=50`,
        ]
        for (const path of pathsToTry) {
          const data = await fetchAbbyPath(abby, path)
          const docs: any[] = data?.docs ?? data?.data ?? (Array.isArray(data) ? data : [])
          _debug.probes.push({ src: path, status: data?._status, count: docs.length, rawKeys: data ? Object.keys(data).slice(0, 8) : null })
          if (docs.length > 0) {
            processInvoiceDocs(docs, clientName, contactId, orgId, invoices)
            if (invoices.length > 0) break
          }
        }
        if (invoices.length > 0) break
      }
    }

    // ── Strategy D: ID as PATH segment (mirroring POST /v2/billing/invoice/{customerId}) ──
    if (invoices.length === 0) {
      const ids = [...new Set([contactId, orgId].filter(Boolean))] as string[]
      for (const id of ids) {
        const pathsToTry = [
          `/v2/billing/invoice/${id}`,
          `/v2/billing/invoice/${id}?page=1&limit=50`,
          `/v2/billing/estimate/${id}`,
        ]
        for (const path of pathsToTry) {
          const data = await fetchAbbyPath(abby, path)
          const docs: any[] = data?.docs ?? data?.data ?? data?.billings ?? (Array.isArray(data) ? data : [])
          _debug.probes.push({ src: path, status: data?._status, count: docs.length, rawKeys: data ? Object.keys(data).slice(0, 10) : null })
          if (docs.length > 0) {
            processInvoiceDocs(docs, clientName, contactId, orgId, invoices)
            if (invoices.length > 0) break
          }
        }
        if (invoices.length > 0) break
      }
    }

    // ── Strategy E: bare /v2/billing list (all docs, filter client-side) ──
    if (invoices.length === 0) {
      const pathsToTry = [
        '/v2/billing?page=1&limit=100',
        '/v2/billing?page=1&limit=100&state=sent',
        '/v2/billing?page=1&limit=100&state=finalized',
      ]
      for (const path of pathsToTry) {
        const data = await fetchAbbyPath(abby, path)
        const docs: any[] = data?.docs ?? data?.data ?? data?.billings ?? (Array.isArray(data) ? data : [])
        _debug.probes.push({ src: path, status: data?._status, count: docs.length, rawKeys: data ? Object.keys(data).slice(0, 10) : null })
        if (docs.length > 0) {
          processInvoiceDocs(docs, clientName, contactId, orgId, invoices)
          if (invoices.length > 0) break
        }
      }
    }

  } catch (e) { _debug.outerError = String(e) }

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ orders, invoices, _debug })
}

function processInvoiceDocs(
  docs: any[],
  clientName: string,
  contactId: string | null,
  orgId: string | null,
  invoices: { id: string; number: string; state: string; label: string; amount: number; dueAt?: number }[]
) {
  const STATE_LABEL: Record<string, string> = {
    finalized: 'En attente', sent: 'Envoyée', overdue: 'En retard',
  }
  const clientUpper = clientName.toUpperCase()

  for (const inv of docs) {
    const invState: string = inv.state ?? inv.billingState ?? ''
    if (['paid', 'archived', 'cancelled', 'draft'].includes(invState)) continue

    const billingType: string = inv.type ?? inv.billingType ?? inv.documentType ?? ''
    if (billingType && !['invoice', 'facture'].includes(billingType.toLowerCase())) continue

    // Match by contact/org ID or by client name in any field
    const invContactId: string = inv.contactId ?? inv.contact?.id ?? inv.customerId ?? ''
    const invOrgId: string = inv.organizationId ?? inv.organization?.id ?? ''
    const invName: string = JSON.stringify(inv).toUpperCase()
    const matchById = (contactId && invContactId === contactId) || (orgId && (invContactId === orgId || invOrgId === orgId))
    const matchByName = invName.includes(clientUpper)

    if (!matchById && !matchByName) continue

    if (invoices.find(i => i.id === inv.id)) continue

    invoices.push({
      id: inv.id,
      number: inv.number ?? '',
      state: invState,
      label: STATE_LABEL[invState] ?? 'À régler',
      amount: (inv.total?.amountWithTaxAfterDiscount ?? inv.total?.amountWithTax ?? inv.amount ?? 0) / 100,
      dueAt: inv.dueAt ?? inv.dueDate ?? undefined,
    })
  }
}
