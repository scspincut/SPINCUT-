import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  invoiced: 'Facturé',
  paid: 'Payé',
  delivered: 'Livré',
  cancelled: 'Annulé',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const bdcId = req.query.bdcId as string
  if (!bdcId?.trim()) return res.status(400).json({ error: 'bdcId requis' })

  const apiKey = process.env.ABBY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY non configurée' })

  try {
    const abby = new Abby(apiKey)
    const { data: bdc } = await abby.billing.getBillingById({
      path: { billingId: bdcId.trim() },
    })
    const bdcAny = bdc as any
    const status: string = bdcAny.status ?? 'unknown'
    return res.status(200).json({ status, label: STATUS_LABELS[status] ?? status })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
  }
}
