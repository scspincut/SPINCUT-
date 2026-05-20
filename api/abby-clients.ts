import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ABBY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY non configurée' })

  try {
    const abby = new Abby(apiKey)
    const result: { id: string; name: string; phone?: string }[] = []
    const seen = new Set<string>()

    // Fetch organisations (companies)
    let page = 1
    let hasMore = true
    while (hasMore) {
      const { data } = await abby.organization.retrieveOrganizations({
        query: { limit: 100, page },
      })
      const docs = data?.docs ?? []
      for (const o of docs) {
        const name = (o.commercialName || o.name || '').trim()
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase())
          result.push({ id: o.id, name })
        }
      }
      hasMore = docs.length === 100
      page++
    }

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return res.status(500).json({ error: `Erreur Abby : ${msg}` })
  }
}
