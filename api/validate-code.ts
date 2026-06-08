import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code } = req.body as { code: string }
  if (!code) return res.status(400).json({ error: 'Code manquant' })

  const normalized = code.trim().toUpperCase()

  if (normalized === 'TEST') {
    return res.status(200).json({ valid: true, clientName: 'Démo SPINCUT', isTest: true })
  }

  // Fallback statique : ACCESS_CODES=CODE1,CODE2,... dans les variables Vercel
  // Utilisé quand Sheets est indisponible — à maintenir manuellement dans le dashboard Vercel
  const staticCodes = (process.env.ACCESS_CODES ?? '')
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean)

  const sheetsUrl = process.env.SHEETS_API_URL
  const sheetsSecret = process.env.SHEETS_SECRET

  if (sheetsUrl && sheetsSecret) {
    try {
      const resp = await fetch(`${sheetsUrl}?secret=${encodeURIComponent(sheetsSecret)}&action=getCodes`, {
        method: 'GET',
      })
      if (resp.ok) {
        const data = await resp.json() as { codes?: { code: string; clientName: string; active: boolean; isTest?: boolean }[] }
        const codes = data.codes ?? []
        const match = codes.find(c => c.code === normalized && c.active)
        if (match) {
          return res.status(200).json({ valid: true, clientName: match.clientName, isTest: match.isTest ?? false })
        }
        // Sheets a répondu mais le code n'est pas dedans — vérifier quand même ACCESS_CODES
        if (staticCodes.includes(normalized)) {
          return res.status(200).json({ valid: true, clientName: normalized })
        }
        return res.status(200).json({ valid: false })
      }
      // Sheets a renvoyé une erreur HTTP — fallback ACCESS_CODES
    } catch {
      // Sheets injoignable — fallback ACCESS_CODES
    }
  }

  // Sheets absent ou en erreur : utiliser ACCESS_CODES
  if (staticCodes.includes(normalized)) {
    return res.status(200).json({ valid: true, clientName: normalized })
  }

  return res.status(200).json({ valid: false })
}
