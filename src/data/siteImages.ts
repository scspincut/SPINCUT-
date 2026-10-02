// Emplacements photo de la page d'accueil.
// Pour ajouter une photo : déposer le fichier dans /public/site/ puis renseigner `src`
// (ex. src: '/site/fraises-cnc.jpg'). Tant que `src` est vide, un emplacement stylé s'affiche.

export interface ImageSlot {
  label: string
  src?: string
}

// Visuel du haut de page (1 grande + 2 petites)
export const HERO_IMAGES: ImageSlot[] = [
  { label: 'Fraises CNC' },
  { label: 'Lames carbure' },
  { label: 'Machines à bois' },
]

// Une photo par carte service, dans l'ordre : Outillage CNC, Outillage bois, Affûtage, Machines à bois
export const SERVICE_IMAGES: ImageSlot[] = [
  { label: 'Outillage CNC' },
  { label: 'Outillage bois' },
  { label: "Service d'affûtage" },
  { label: 'Machines à bois' },
]
