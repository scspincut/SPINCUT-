// Partenaires, marques et fournisseurs affichés sur la page d'accueil.
// Pour ajouter un logo ou une photo : déposer le fichier dans /public/partners/ puis renseigner
// `logo` (ex. '/partners/casadei.png') et/ou `photo` (ex. '/partners/casadei-atelier.jpg').
// Sans logo ni photo, le nom s'affiche en texte gris. `url` (optionnel) rend la carte cliquable.

export interface Partner {
  name: string
  logo?: string
  photo?: string
  description?: string
  url?: string
}

export const PARTNERS: Partner[] = [
  { name: 'Forézienne' },
  { name: 'Casadei' },
  { name: 'Partenaire' },
  { name: 'Partenaire' },
  { name: 'Partenaire' },
  { name: 'Partenaire' },
]

// Catalogues et documentations (PDF), consultables en ligne et téléchargeables.
// Pour en ajouter un : déposer le PDF dans /public/catalogues/ puis ajouter une ligne, par exemple :
//   { title: 'Catalogue fraises 2026', brand: 'Forézienne', file: '/catalogues/forezienne-2026.pdf' },
// `cover` (optionnel) : image de couverture, ex. '/catalogues/forezienne-2026.jpg'.

export interface Catalogue {
  title: string
  brand?: string
  file: string
  cover?: string
}

export const CATALOGUES: Catalogue[] = []
