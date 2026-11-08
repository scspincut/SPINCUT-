// Emplacements photo de la page d'accueil.
// Pour ajouter une photo : déposer le fichier dans /public/site/ puis renseigner `src`
// (ex. src: '/site/fraises-carbure.jpg'). Tant que `src` est vide, un emplacement stylé s'affiche.

export interface ImageSlot {
  label: string
  src?: string
}

// Haut de page : vitrine de 3 produits (photos studio), affichées côte à côte
export const HERO_IMAGES: ImageSlot[] = [
  { label: 'Fraises carbure', src: '/site/fraise-carbure.jpg' },
  { label: 'Fraises diamant', src: '/site/fraise-diamant.jpg' },
  { label: "Fraises d'ébauche", src: '/site/fraise-ebauche.jpg' },
]

// Une photo par carte service, dans l'ordre : Machines à bois, Outillage CNC, Outillages bois, Affûtage
export const SERVICE_IMAGES: ImageSlot[] = [
  { label: 'Machines à bois' },
  { label: 'Outillage CNC' },
  { label: 'Outillages bois' },
  { label: 'Affûtage', src: '/site/affutage-machine.jpg' },
]
