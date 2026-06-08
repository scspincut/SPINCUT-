import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, phone, company } = req.body as {
    name: string; email: string; phone?: string; company?: string
  }

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Nom et email requis' })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY non configurée' })

  const lignes = [
    `<tr><td style="padding:6px 0;color:#888;font-size:13px;">Nom</td><td style="padding:6px 0;color:#eee;font-size:13px;font-weight:bold;">${name.trim()}</td></tr>`,
    company?.trim() ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;">Société</td><td style="padding:6px 0;color:#eee;font-size:13px;">${company.trim()}</td></tr>` : '',
    `<tr><td style="padding:6px 0;color:#888;font-size:13px;">Email</td><td style="padding:6px 0;color:#d4780f;font-size:13px;"><a href="mailto:${email.trim()}" style="color:#d4780f;">${email.trim()}</a></td></tr>`,
    phone?.trim() ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;">Téléphone</td><td style="padding:6px 0;color:#eee;font-size:13px;"><a href="tel:${phone.trim()}" style="color:#eee;">${phone.trim()}</a></td></tr>` : '',
  ].filter(Boolean).join('')

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? 'SPINCUT <onboarding@resend.dev>',
        to: ['scspincut@gmail.com'],
        subject: `📩 Nouvelle demande — ${name.trim()}${company?.trim() ? ` (${company.trim()})` : ''}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#111;color:#eee;border-radius:12px;padding:24px;">
            <h2 style="color:#d4780f;margin-top:0;">Nouvelle demande de contact</h2>
            <p style="color:#888;font-size:13px;margin-bottom:16px;">Un prospect souhaite être contacté via l'app SPINCUT.</p>
            <table style="width:100%;border-collapse:collapse;">${lignes}</table>
            <div style="margin-top:20px;display:flex;gap:12px;">
              <a href="mailto:${email.trim()}" style="display:inline-block;background:#d4780f;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;">Répondre par email</a>
              ${phone?.trim() ? `<a href="https://wa.me/${phone.trim().replace(/\D/g, '')}" style="display:inline-block;background:#1a5e1a;color:#4ade80;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;">WhatsApp</a>` : ''}
            </div>
          </div>`,
      }),
    })

    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      return res.status(500).json({ error: (err as any).message ?? 'Erreur Resend' })
    }

    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Erreur inconnue' })
  }
}
