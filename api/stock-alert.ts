import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientName, tool, qty, orderQty } = req.body as {
    clientName: string
    tool: {
      type: string
      diametre: number
      lc: number
      lt: number
      dents: string
      notes?: string
    }
    qty: number
    orderQty: number
  }

  if (!clientName || !tool) return res.status(400).json({ error: 'Données manquantes' })

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY non configurée' })

  const from = process.env.RESEND_FROM ?? 'SPINCUT <onboarding@resend.dev>'

  const toolDesc = `${tool.type} Ø${tool.diametre}mm · Z=${tool.dents} · LC=${tool.lc}mm · LT=${tool.lt}mm`

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: ['scspincut@gmail.com'],
      subject: `🔔 Seuil critique atteint — ${clientName}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#111;color:#eee;border-radius:12px;padding:24px;">
          <h2 style="color:#fbbf24;margin-top:0;">⚠️ Seuil critique atteint</h2>
          <p><strong>Client :</strong> ${clientName}</p>
          <div style="background:#1a1400;border:1px solid #3a2a00;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:bold;">${toolDesc}</p>
            ${tool.notes ? `<p style="margin:4px 0 0;color:#888;font-size:13px;">Note : ${tool.notes}</p>` : ''}
          </div>
          <table style="width:100%;border-collapse:collapse;margin:12px 0;">
            <tr>
              <td style="padding:8px 12px;background:#1a1a1a;border-radius:6px 0 0 6px;">
                <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Quantité restante</div>
                <div style="color:#fbbf24;font-size:24px;font-weight:900;margin-top:2px;">${qty}</div>
              </td>
              <td style="padding:8px 12px;background:#0a1a0a;border-radius:0 6px 6px 0;">
                <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">À livrer</div>
                <div style="color:#4ade80;font-size:24px;font-weight:900;margin-top:2px;">${orderQty}</div>
              </td>
            </tr>
          </table>
          <p style="color:#888;font-size:12px;margin-top:16px;">Le client a atteint son seuil critique. Une livraison de <strong style="color:#eee">${orderQty} unité${orderQty > 1 ? 's' : ''}</strong> est attendue.</p>
        </div>`,
    }),
  })

  if (!r.ok) {
    const err = await r.text()
    return res.status(500).json({ error: `Resend error: ${err}` })
  }

  return res.status(200).json({ success: true })
}
