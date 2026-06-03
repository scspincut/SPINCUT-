import type { VercelRequest, VercelResponse } from '@vercel/node'
import Abby from '@abby-inc/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.ABBY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ABBY_API_KEY non configurée' })

  const abby = new Abby(apiKey)

  // GET — récupère les infos du contact + organisation Abby
  if (req.method === 'GET') {
    const { clientName } = req.query
    if (!clientName || typeof clientName !== 'string') {
      return res.status(400).json({ error: 'clientName requis' })
    }
    try {
      // Search contacts and organizations in parallel
      const [contactsRes, orgsRes] = await Promise.allSettled([
        abby.contact.retrieveContacts({ query: { search: clientName, limit: 5, page: 1 } }),
        abby.organization.retrieveOrganizations({ query: { search: clientName, limit: 5, page: 1 } as any }),
      ])

      const contact = contactsRes.status === 'fulfilled' ? contactsRes.value.data?.docs?.[0] : undefined
      const org = orgsRes.status === 'fulfilled' ? (orgsRes.value.data as any)?.docs?.[0] : undefined

      if (!contact && !org) {
        return res.status(404).json({ error: 'Contact introuvable dans Abby' })
      }

      res.setHeader('Cache-Control', 'no-store')

      // Merge: contact fields + org supplements for missing phone/address
      return res.status(200).json({
        id: contact?.id ?? org?.id,
        orgId: org?.id ?? null,
        firstname: contact?.firstname ?? '',
        lastname: contact?.lastname ?? '',
        emails: contact?.emails ?? [],
        phone: contact?.phone || org?.phone || '',
        billingAddress: (contact as any)?.billingAddress ?? org?.billingAddress ?? null,
      })
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }

  // PATCH — met à jour le contact et/ou l'organisation dans Abby
  if (req.method === 'PATCH') {
    const { id, orgId, firstname, lastname, emails, phone, billingAddress } = req.body as {
      id: string
      orgId?: string | null
      firstname?: string
      lastname?: string
      emails?: string[]
      phone?: string
      billingAddress?: { address: string | null; complement?: string | null; city: string | null; zipCode: string | null; country: string }
    }
    if (!id) return res.status(400).json({ error: 'id requis' })
    try {
      // Update contact if it's a contact id (org id and contact id may differ)
      const isOrgOnly = id === orgId
      if (!isOrgOnly) {
        const { data: current } = await abby.contact.getContact({ path: { id } })
        await abby.contact.updateContact({
          path: { id },
          body: {
            firstname: firstname ?? current.firstname,
            lastname: lastname ?? current.lastname,
            emails: emails ?? current.emails,
            phone: phone ?? current.phone,
            billingAddress: billingAddress
              ? { ...billingAddress, country: billingAddress.country as any }
              : (current as any).billingAddress,
          },
        })
      }

      // Also update organization phone/address if orgId provided
      if (orgId && (phone !== undefined || billingAddress !== undefined)) {
        try {
          const { data: currentOrg } = await abby.organization.getOrganization({ path: { id: orgId } })
          await abby.organization.updateOrganization({
            path: { id: orgId },
            body: {
              name: (currentOrg as any).name,
              phone: phone ?? (currentOrg as any).phone,
              billingAddress: billingAddress
                ? { ...billingAddress, country: billingAddress.country as any }
                : (currentOrg as any).billingAddress,
            } as any,
          })
        } catch {} // non-critical — org update is best-effort
      }

      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
