import type { VercelRequest, VercelResponse } from '@vercel/node'

interface SheetRow {
  sheet: string
  row: number
  famille: string
  ref: string
  designation: string
  diametre: string
  lc: string
  lt: string
  dents: string
  angle: string
  queue: string
  sens: string
  prix: number
  stock: number
}

function isPMProduct(p: SheetRow): boolean {
  const fields = [p.famille, p.ref, p.designation, p.diametre, p.lc, p.lt, p.dents, p.angle, p.queue, p.sens]
  return fields.some(v => typeof v === 'string' && v.toUpperCase().includes('PM'))
}

function categorize(p: SheetRow): string {
  const f = p.famille.trim()
  const desig = (p.designation || '').toUpperCase()

  if (isPMProduct(p)) return 'polimiroir'
  if (f.includes('GRAV')) return 'gravure'
  if (f.startsWith('FD')) return 'diamant'
  if (f.includes('RAV')) return 'ravageuse'
  if (f.startsWith('F-PERC')) return 'percage'
  if (f === 'COLLET' || f.includes('DUST') || f.includes('EXTRACTION')) return 'accessoires'
  if (f.includes('ALU') || p.ref.toUpperCase().includes('ALU')) return 'alu'
  if (p.sens === 'UP AND DOWN') return 'compression'

  // Fraises CMT — détection par désignation
  if (desig.includes('RAINUR') || desig.includes('RAINER')) return 'rainurer'
  if (desig.includes('AFFLEUR')) return 'affleurer'
  if (desig.includes('FEUILLUR') || desig.includes('FEUILLERE') || desig.includes('FEUILLU')) return 'feuillure'
  if (desig.includes('FAÇONN') || desig.includes('FACON') || desig.includes('FACONN')) return 'faconner'
  if (desig.includes('PLAQUETTE') || desig.includes('COUTEAU')) return 'plaquette'

  // Cônes et kits nettoyage → Accessoires
  if (desig.includes('CONE') || desig.includes('CÔNE') || desig.includes('RÉDUCT')) return 'accessoires'
  if (desig.includes('KIT') || desig.includes('NETTOYAGE') || desig.includes('NETTOY')) return 'accessoires'

  return 'classique'
}

function makeDesignation(p: SheetRow): string {
  if (p.designation && p.designation.trim() !== '' && p.designation.trim() !== '/') {
    return p.designation.trim()
  }
  const f = p.famille.trim()
  const d = p.diametre && p.diametre !== '/' ? `Ø${p.diametre}` : ''
  const lc = p.lc && p.lc !== '/' ? ` LC${p.lc}` : ''
  const lt = p.lt && p.lt !== '/' ? ` LT${p.lt}` : ''
  const z = p.dents && p.dents !== '/' ? ` Z${p.dents}` : ''
  const q = p.queue && p.queue !== '/' ? `Q${p.queue}` : ''
  const suffix = q ? ` — ${q}` : ''

  if (f.includes('GRAV')) {
    const ang = p.angle && p.angle !== '/' ? `${p.angle}°` : ''
    return `Fraise gravure ${ang}${lt}${z}${suffix}`
  }
  if (f.startsWith('FD')) {
    return `Fraise diamant${d ? ' ' + d : ''}${lc}${lt}${z}${suffix}`
  }
  if (f === 'COLLET') {
    return `Collet ER32${d ? ' ' + d : ''}`
  }
  if (f.includes('DUST') || f.includes('EXTRACTION')) {
    return `Kit aspiration ${p.diametre}`
  }
  if (f.includes('RAV')) {
    return `Fraise ravageuse${d ? ' ' + d : ''}${lc}${lt}${z}${suffix}`
  }
  if (f.startsWith('F-PERC')) {
    const dir = p.ref.endsWith('L') ? ' — Gauche' : p.ref.endsWith('R') ? ' — Droite' : ''
    return `Foret${d ? ' ' + d : ''}${lc}${lt}${dir}${suffix}`
  }
  return `${d}${lc}${lt}${z}${suffix}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const url = process.env.SHEETS_API_URL
  const secret = process.env.SHEETS_SECRET
  if (!url || !secret) return res.status(500).json({ error: 'Google Sheets non configuré' })

  // Diagnostic : lister les onglets disponibles dans le Google Sheet
  if (req.query.debug === 'sheets') {
    try {
      const r = await fetch(`${url}?secret=${encodeURIComponent(secret)}&action=sheets`, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      })
      const data = await r.json()
      return res.status(200).json(data)
    } catch (e) {
      return res.status(500).json({ error: String(e) })
    }
  }

  try {
    const response = await fetch(`${url}?secret=${encodeURIComponent(secret)}`, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SPINCUT/1.0)', 'Accept': 'application/json' },
    })
    if (!response.ok) return res.status(502).json({ error: `Erreur Google Sheets ${response.status}` })

    const raw: unknown = await response.json()
    if (!Array.isArray(raw)) {
      const errMsg = (raw as Record<string, unknown>)?.error ?? JSON.stringify(raw)
      return res.status(403).json({ error: `Accès Google Sheets refusé: ${errMsg}` })
    }

    // Normalise les noms de champs : le GAS peut retourner "ID Famille", "Stock", etc.
    // selon les en-têtes réels du Sheet — on accepte toutes les variantes connues.
    function pick(p: Record<string, unknown>, ...keys: string[]): string {
      for (const k of keys) { const v = p[k]; if (v !== undefined && v !== null && v !== '') return String(v) }
      return '/'
    }
    function pickNum(p: Record<string, unknown>, ...keys: string[]): number {
      for (const k of keys) { const v = p[k]; if (v !== undefined && v !== null && v !== '') { const n = Number(v); if (!isNaN(n)) return n } }
      return 0
    }

    const products = (raw as Record<string, unknown>[]).map(p => {
      const normalized: SheetRow = {
        sheet:      pick(p, 'sheet'),
        row:        Number(p.row ?? 0),
        famille:    pick(p, 'famille', 'ID Famille', 'Famille', 'Family', 'id famille'),
        ref:        pick(p, 'ref', 'Ref fournisseur', 'Réf fournisseur', 'REF', 'Ref', 'Référence', 'Reference', 'ref fournisseur'),
        designation:pick(p, 'designation', 'Désignation', 'Designation', 'Nom', 'désignation'),
        diametre:   pick(p, 'diametre', 'Diametre', 'Diamètre', 'DIAMETRE', 'Diam', 'diam', 'Diamètre Ø', 'Diametre Ø'),
        lc:         pick(p, 'lc', 'LC', 'Lc', 'longueur coupe', 'Longueur coupe', 'LC (I)', 'LC(I)'),
        lt:         pick(p, 'lt', 'LT', 'Lt', 'longueur totale', 'Longueur totale', 'LT(L)', 'LT (L)'),
        dents:      pick(p, 'dents', 'Dents', 'DENTS', 'Z', 'Flûtes', 'dents'),
        angle:      pick(p, 'angle', 'Angle', 'ANGLE', 'Angle°'),
        queue:      pick(p, 'queue', 'Queue', 'QUEUE', 'shank', 'Shank', 'Queue (S)', 'Queue(S)'),
        sens:       pick(p, 'sens', 'SENS', 'Sens', 'sens', 'Direction'),
        prix:       pickNum(p, 'prix', 'Prix arrondie', 'Prix vente TTC', 'Prix achat final', 'Prix achat MOY', 'Prix achat', 'PRIX', 'price'),
        stock:      pickNum(p, 'stock', 'Stock', 'STOCK', 'Qty', 'Quantité', 'QTY'),
      }
      const designation = makeDesignation(normalized)
      const pm = isPMProduct(normalized)
      return { ...normalized, pm, category: categorize(normalized), designation }
    })

    // Dédoublonnage : fusionne uniquement si même ref ET même ligne (produit en double entre A0 et A2)
    const deduped = new Map<string, typeof products[0]>()
    for (const p of products) {
      const key = `${p.ref}__${p.row}`
      if (deduped.has(key)) {
        const existing = deduped.get(key)!
        deduped.set(key, { ...existing, stock: existing.stock + p.stock })
      } else {
        deduped.set(key, p)
      }
    }

    res.setHeader('Cache-Control', 'no-store')
    // Retourner tous les produits qui ont un nom de feuille valide (commence par STOCK)
    const visible = [...deduped.values()].filter(p =>
      typeof p.sheet === 'string' && p.sheet.toUpperCase().startsWith('STOCK')
    )
    return res.status(200).json(visible)
  } catch {
    return res.status(500).json({ error: 'Erreur catalogue' })
  }
}
