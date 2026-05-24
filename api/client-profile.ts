import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.ABBY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY non configurée' })

  const abby = new Abby(apiKey)

  // GET — récupère les infos du contact Abby
  if (req.method === 'GET') {
    const { clientName } = req.query
    if (!clientName || typeof clientName !== 'string') {
      return res.status(400).json({ error: 'clientName requis' })
    }
    try {
      const { data: contacts } = await abby.contact.retrieveContacts({
        query: { search: clientName, limit: 5, page: 1 },
      })
      const contact = contacts?.docs?.[0]
      if (!contact) return res.status(404).json({ error: 'Contact introuvable dans Abby' })
      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).json({
        id: contact.id,
        firstname: contact.firstname ?? '',
        lastname: contact.lastname ?? '',
        emails: contact.emails ?? [],
        phone: contact.phone ?? '',
        deliveryAddress: contact.deliveryAddress ?? null,
      })
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }

  // PATCH — met à jour le contact dans Abby
  if (req.method === 'PATCH') {
    const { id, emails, phone, deliveryAddress } = req.body as {
      id: string
      emails?: string[]
      phone?: string
      deliveryAddress?: { address: string | null; complement?: string | null; city: string | null; zipCode: string | null; country: string }
    }
    if (!id) return res.status(400).json({ error: 'id requis' })
    try {
      const { data: current } = await abby.contact.getContact({ path: { id } })
      await abby.contact.updateContact({
        path: { id },
        body: {
          firstname: current.firstname,
          lastname: current.lastname,
          emails: emails ?? current.emails,
          phone: phone ?? current.phone,
          deliveryAddress: deliveryAddress
            ? { ...deliveryAddress, country: deliveryAddress.country as any }
            : current.deliveryAddress,
        },
      })
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
