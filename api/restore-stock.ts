import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { sheet, row, quantity } = req.body as { sheet: string; row: number; quantity: number }

  if (!sheet || !row || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'sheet, row et quantity (> 0) requis' })
  }

  const sheetsUrl = process.env.SHEETS_API_URL ?? 'https://script.google.com/macros/s/AKfycbw8ux3tMJv_5emOUcfd4c18YMRoHbKAgrLvyYP6OmAKcja7to-nBjtltWlvrzacfxC3Qg/exec'
  const sheetsSecret = process.env.SHEETS_SECRET ?? 'SPINCUT-STOCK-2025'
  if (!sheetsUrl || !sheetsSecret) {
    return res.status(500).json({ error: 'Google Sheets non configuré' })
  }

  try {
    // Envoie une quantité négative pour remettre en stock (stock = stock - (-qty) = stock + qty)
    const r = await fetch(sheetsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: sheetsSecret,
        updates: [{ sheet, row, qty: -quantity }],
      }),
    })
    if (!r.ok) throw new Error('Erreur Google Sheets')
    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
  }
}
