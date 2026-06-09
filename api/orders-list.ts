import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const sheetsUrl = process.env.SHEETS_API_URL
  const sheetsSecret = process.env.SHEETS_SECRET
  if (!sheetsUrl || !sheetsSecret) return res.status(500).json({ error: 'GAS non configuré' })

  try {
    const r = await fetch(`${sheetsUrl}?secret=${encodeURIComponent(sheetsSecret)}&action=orders`)
    if (!r.ok) throw new Error('Erreur GAS')
    const data = await r.json()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(Array.isArray(data) ? data : [])
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
  }
}
