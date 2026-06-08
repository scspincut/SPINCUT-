import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code } = req.body as { code: string }
  if (!code) return res.status(400).json({ error: 'Code manquant' })

  const normalized = code.trim().toUpperCase()

  // Code TEST toujours valide (démo)
  if (normalized === 'TEST') {
    return res.status(200).json({ valid: true, clientName: 'Démo SPINCUT', isTest: true })
  }

  const sheetsUrl = process.env.SHEETS_API_URL
  const sheetsSecret = process.env.SHEETS_SECRET
  if (!sheetsUrl || !sheetsSecret) {
    return res.status(500).json({ error: 'Configuration serveur manquante' })
  }

  try {
    // GET évite le problème de redirection 302 de Google Apps Script qui perd le corps POST
    const resp = await fetch(`${sheetsUrl}?secret=${encodeURIComponent(sheetsSecret)}&action=getCodes`, {
      method: 'GET',
    })
    if (!resp.ok) throw new Error(`Sheets HTTP ${resp.status}`)
    const data = await resp.json() as { codes?: { code: string; clientName: string; active: boolean; isTest?: boolean }[] }
    const codes = data.codes ?? []
    const match = codes.find(c => c.code === normalized && c.active)
    if (match) {
      return res.status(200).json({ valid: true, clientName: match.clientName, isTest: match.isTest ?? false })
    }
    return res.status(200).json({ valid: false })
  } catch (err) {
    return res.status(500).json({ error: `Erreur validation : ${err instanceof Error ? err.message : String(err)}` })
  }
}
