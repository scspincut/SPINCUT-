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
      path: { documentId: bdcId.trim() },
    })
    const bdcAny = bdc as any
    const lines: { reference?: string; designation?: string; quantity?: number }[] = bdcAny.lines ?? []

    if (!lines.length) return res.status(400).json({ error: 'Aucune ligne trouvée dans ce BDC' })

    // 2. Récupérer le catalogue
    const catalogResp = await fetch(`${sheetsUrl}?secret=${encodeURIComponent(sheetsSecret)}`)
    if (!catalogResp.ok) return res.status(502).json({ error: 'Impossible de lire Google Sheets' })
    const catalog: Record<string, unknown>[] = await catalogResp.json()

    // Extrait la ref depuis un objet brut GAS (colonnes variables selon l'onglet)
    function getRef(p: Record<string, unknown>): string {
      const keys = ['ref', 'Réf fournisseur', 'Ref fournisseur', 'REF', 'Ref', 'Référence', 'ref fournisseur']
      for (const k of keys) { const v = p[k]; if (v !== undefined && v !== null && v !== '') return String(v).trim() }
      return ''
    }

    // 3. Restituer le stock (quantités négatives = remise en stock)
    const updates: { sheet: string; row: number; qty: number }[] = []
    const restored: { ref: string; designation: string; quantity: number }[] = []
    const unmatched: string[] = []

    for (const line of lines) {
      const ref = String(line.reference ?? '').trim()
      if (!ref) continue
      const product = catalog.find(p => getRef(p) === ref)
      if (!product) { unmatched.push(ref || String(line.designation ?? '?')); continue }
      const qty = Number(line.quantity ?? 1)
      updates.push({ sheet: String(product.sheet), row: Number(product.row), qty: -qty }) // négatif = remise en stock
      restored.push({ ref, designation: String(line.designation ?? ''), quantity: qty })
    }

    if (updates.length > 0) {
      await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: sheetsSecret, updates }),
      })
    }

    // 4. Archiver le BDC dans Abby (annulation)
    let abbyStatus = 'archived'
    try {
      await (abby.billing.archiveBillingDocument as any)({ path: { documentId: bdcId.trim() } })
    } catch {
      abbyStatus = 'stock_restored_only' // stock restitué mais BDC à annuler manuellement dans Abby
    }

    return res.status(200).json({ success: true, restored, unmatched, abbyStatus })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
  }
}
