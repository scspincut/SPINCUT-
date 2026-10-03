// Emplacements photo de la page d'accueil.
// Pour ajouter une photo : déposer le fichier dans /public/site/ puis renseigner `src`
// (ex. src: '/site/fraises-carbure.jpg'). Tant que `src` est vide, un emplacement stylé s'affiche.

export interface ImageSlot {
  label: string
  src?: string
}

// Haut de page : 7 photos de même format, affichées côte à côte
export const HERO_IMAGES: ImageSlot[] = [
  { label: 'Fraises carbure' },
  { label: 'Fraises diamant' },
  { label: 'Lames carbure' },
  { label: 'Affûtage' },
  { label: 'Machine 1' },
  { label: 'Machine 2' },
  { label: 'Machine 3' },
]

// Une photo par carte service, dans l'ordre : Machines à bois, Outillage CNC, Outillage bois, Affûtage
export const SERVICE_IMAGES: ImageSlot[] = [
  { label: 'Machines à bois' },
  { label: 'Outillage CNC' },
  { label: 'Outillage bois' },
  { label: 'Affûtage' },
]
