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
      // 1. Find contact by name
      const { data: contacts } = await abby.contact.retrieveContacts({
        query: { search: clientName, limit: 5, page: 1 },
      })
      const contact = contacts?.docs?.[0]

      // 2. Get linked organization: prefer the embedded org ID on the contact,
      //    fall back to a name search
      let org: any = null
      const embeddedOrgId = (contact as any)?.organization?.id
      if (embeddedOrgId) {
        try {
          const { data: fetchedOrg } = await abby.organization.retrieveOrganization({
            path: { id: embeddedOrgId },
          })
          org = fetchedOrg
        } catch {}
      }
      if (!org) {
        try {
          const { data: orgs } = await abby.organization.retrieveOrganizations({
            query: { search: clientName, limit: 5, page: 1 },
          })
          org = orgs?.docs?.[0] ?? null
        } catch {}
      }

      if (!contact && !org) {
        return res.status(404).json({ error: 'Contact introuvable dans Abby' })
      }

      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).json({
        id: contact?.id ?? org?.id,
        orgId: org?.id ?? null,
        // For company clients, lastname falls back to org commercial/name
        firstname: contact?.firstname ?? '',
        lastname: contact?.lastname || org?.commercialName || org?.name || '',
        emails: contact?.emails ?? org?.emails ?? [],
        phone: contact?.phone || (org as any)?.phone || (org as any)?.phoneNumber || (org as any)?.mobilePhone || '',
        billingAddress: contact?.billingAddress ?? org?.billingAddress ?? null,
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

      // Also update organization address if orgId provided
      if (orgId && billingAddress !== undefined) {
        try {
          const { data: currentOrg } = await abby.organization.retrieveOrganization({ path: { id: orgId } })
          await abby.organization.updateOrganization({
            path: { id: orgId },
            body: {
              name: (currentOrg as any).name,
              billingAddress: billingAddress
                ? { ...billingAddress, country: billingAddress.country as any }
                : (currentOrg as any).billingAddress,
            } as any,
          })
        } catch {}
      }

      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
