// Partenaires et marques affichés sur la page d'accueil.
// Pour ajouter un logo : déposer le fichier dans /public/partners/ puis renseigner `logo`
// (ex. '/partners/casadei.png'). Sans logo, le nom s'affiche en texte gris.
// `url` est optionnel : s'il est renseigné, la carte devient un lien.

export interface Partner {
  name: string
  logo?: string
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
