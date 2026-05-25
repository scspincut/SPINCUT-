import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { bdcId } = req.body as { bdcId: string }
  if (!bdcId?.trim()) return res.status(400).json({ error: 'ID du BDC requis' })

  const apiKey = process.env.ABBY_API_KEY
  const sheetsUrl = process.env.SHEETS_API_URL
  const sheetsSecret = process.env.SHEETS_SECRET
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY non configurée' })
  if (!sheetsUrl || !sheetsSecret) return res.status(500).json({ error: 'Google Sheets non configuré' })

  try {
    const abby = new Abby(apiKey)

    // 1. Récupérer le BDC depuis Abby
    const { data: bdc } = await abby.billing.getBillingById({
      path: { billingId: bdcId.trim() },
    })
    const bdcAny = bdc as any
    const lines: { reference?: string; designation?: string; quantity?: number }[] = bdcAny.lines ?? []

    if (!lines.length) {
      return res.status(400).json({ error: 'Aucune ligne trouvée dans ce BDC' })
    }

    // 2. Récupérer le catalogue depuis Google Sheets
    const catalogResp = await fetch(`${sheetsUrl}?secret=${encodeURIComponent(sheetsSecret)}`)
    if (!catalogResp.ok) return res.status(502).json({ error: 'Impossible de lire Google Sheets' })
    const catalog: { sheet: string; row: number; ref: string }[] = await catalogResp.json()

    // 3. Associer chaque ligne BDC à une ligne du catalogue
    const updates: { sheet: string; row: number; qty: number }[] = []
    const deducted: { ref: string; designation: string; quantity: number }[] = []
    const unmatched: string[] = []

    for (const line of lines) {
      const ref = String(line.reference ?? '').trim()
      if (!ref) continue
      const product = catalog.find(p => p.ref === ref)
      if (!product) {
        unmatched.push(ref || line.designation || '?')
        continue
      }
      const qty = Number(line.quantity ?? 1)
      updates.push({ sheet: product.sheet, row: product.row, qty })
      deducted.push({ ref, designation: String(line.designation ?? ''), quantity: qty })
    }

    // 4. Déduire le stock dans Google Sheets
    if (updates.length > 0) {
      await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: sheetsSecret, updates }),
      })
    }

    return res.status(200).json({ success: true, deducted, unmatched })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
  }
}
