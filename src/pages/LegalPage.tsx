import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LEGAL } from '../data/legal'

// Espace insécable, avant « : » (typographie française)
const NB = ' '

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-spincut-muted leading-relaxed">{children}</div>
    </section>
  )
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p><span className="text-white font-semibold">{label}{NB}:</span> {children}</p>
  )
}

function MentionsLegales() {
  return (
    <>
      <Section title="Éditeur du site">
        <Line label="Nom commercial">{LEGAL.tradeName}</Line>
        <Line label="Exploitant">{LEGAL.owner}</Line>
        <Line label="Statut">{LEGAL.status}</Line>
        <Line label="SIRET">{LEGAL.siret}</Line>
        <Line label="TVA intracommunautaire">{LEGAL.vat}</Line>
        {LEGAL.address && <Line label="Adresse">{LEGAL.address}</Line>}
        <Line label="Email"><a href={`mailto:${LEGAL.email}`} className="text-spincut-gold hover:underline">{LEGAL.email}</a></Line>
        <Line label="Téléphone"><a href={`tel:${LEGAL.phoneHref}`} className="text-spincut-gold hover:underline">{LEGAL.phone}</a></Line>
      </Section>

      <Section title="Directeur de la publication">
        <p>{LEGAL.publisher}</p>
      </Section>

      <Section title="Hébergement">
        <p>
          {LEGAL.host.name}, {LEGAL.host.address}{NB}—{' '}
          <a href={LEGAL.host.website} target="_blank" rel="noopener noreferrer" className="text-spincut-gold hover:underline">{LEGAL.host.website.replace('https://', '')}</a>
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          Le logo, les textes, les photos et l'ensemble des contenus du site sont la propriété de {LEGAL.tradeName} ou de ses partenaires.
          Toute reproduction, totale ou partielle, sans autorisation écrite préalable est interdite.
        </p>
        <p>Les marques et logos des fabricants et fournisseurs cités appartiennent à leurs propriétaires respectifs.</p>
      </Section>

      <Section title="Responsabilité">
        <p>
          Les paramètres de coupe proposés par le calculateur sont des recommandations standards.
          Un test avant production est conseillé. {LEGAL.tradeName} ne saurait être tenu responsable d'un usage inadapté de ces valeurs.
        </p>
      </Section>

      <Section title="Données personnelles">
        <p>
          Pour savoir comment vos données sont utilisées et protégées, consultez notre{' '}
          <Link to="/confidentialite" className="text-spincut-gold hover:underline">politique de confidentialité</Link>.
        </p>
      </Section>
    </>
  )
}

function Confidentialite() {
  return (
    <>
      <Section title="Responsable du traitement">
        <p>
          {LEGAL.owner}, {LEGAL.status}, nom commercial {LEGAL.tradeName}, SIRET {LEGAL.siret}.
          Contact{NB}: <a href={`mailto:${LEGAL.email}`} className="text-spincut-gold hover:underline">{LEGAL.email}</a>.
        </p>
      </Section>

      <Section title="Données collectées">
        <p><span className="text-white font-semibold">Demande d'accès{NB}:</span> nom, prénom, poste, société, email et, si vous choisissez WhatsApp, numéro de téléphone.</p>
        <p>
          <span className="text-white font-semibold">Espace client{NB}:</span> code d'accès, coordonnées (nom, société, email, téléphone, adresse de facturation),
          commandes, préférence de contact et informations que vous saisissez (machine, stock d'outils).
        </p>
      </Section>

      <Section title="Pourquoi nous les utilisons">
        <ul className="list-disc pl-5 space-y-2">
          <li>Traiter votre demande d'accès et créer votre compte client (mesures précontractuelles).</li>
          <li>Gérer vos commandes, leur facturation, leur livraison et leur suivi (exécution du contrat).</li>
          <li>Respecter nos obligations comptables et fiscales (obligation légale).</li>
          <li>Répondre à vos questions et vous informer sur vos commandes (intérêt légitime).</li>
        </ul>
        <p>Vos données ne sont jamais vendues ni cédées à des tiers à des fins commerciales.</p>
      </Section>

      <Section title="Qui y a accès">
        <p>Uniquement {LEGAL.tradeName} et les prestataires techniques nécessaires au fonctionnement du service{NB}:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Vercel{NB}: hébergement du site.</li>
          <li>Resend{NB}: envoi des emails (demandes d'accès, confirmations).</li>
          <li>Abby{NB}: gestion des fiches clients, des devis et de la facturation.</li>
          <li>Google{NB}: outil de gestion du catalogue et des commandes.</li>
          <li>WhatsApp (Meta){NB}: uniquement si vous choisissez de nous contacter par ce moyen.</li>
        </ul>
        <p>
          Certains de ces prestataires sont situés hors de l'Union européenne, notamment aux États-Unis.
          Ces transferts sont encadrés par les garanties prévues par le RGPD, telles que les clauses contractuelles types de la Commission européenne.
        </p>
      </Section>

      <Section title="Durée de conservation">
        <ul className="list-disc pl-5 space-y-2">
          <li>Demande d'accès sans suite{NB}: 3 ans à compter du dernier contact.</li>
          <li>Données clients{NB}: pendant toute la relation commerciale, puis 3 ans.</li>
          <li>Factures et pièces comptables{NB}: 10 ans, comme l'exige la loi.</li>
        </ul>
      </Section>

      <Section title="Données enregistrées sur votre appareil">
        <p>
          Pour fonctionner, le site enregistre sur votre appareil (stockage local du navigateur) votre connexion, votre panier, vos favoris,
          vos préférences et votre stock d'outils. Ces informations sont nécessaires au service et ne servent à aucune publicité.
        </p>
        <p>Le site n'utilise pas de cookies publicitaires ni d'outil de mesure d'audience.</p>
      </Section>

      <Section title="Vos droits">
        <p>
          Vous pouvez accéder à vos données, les rectifier, les effacer, en limiter l'utilisation, vous opposer à leur traitement
          ou demander à les récupérer. Écrivez-nous à{' '}
          <a href={`mailto:${LEGAL.email}`} className="text-spincut-gold hover:underline">{LEGAL.email}</a>{NB}: nous répondons sous un mois.
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL{NB}:{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-spincut-gold hover:underline">www.cnil.fr</a>.
        </p>
      </Section>
    </>
  )
}

const PAGES = {
  mentions: { title: 'Mentions légales', content: <MentionsLegales /> },
  confidentialite: { title: 'Politique de confidentialité', content: <Confidentialite /> },
}

export default function LegalPage({ page }: { page: keyof typeof PAGES }) {
  const { title, content } = PAGES[page]

  useEffect(() => {
    window.scrollTo(0, 0)
    const previous = document.title
    document.title = `${title} — ${LEGAL.tradeName}`
    return () => { document.title = previous }
  }, [title])

  return (
    <div className="min-h-screen bg-spincut-bg text-white">
      <header className="sticky top-0 z-40 bg-spincut-bg/80 backdrop-blur-md border-b border-spincut-border/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold text-spincut-muted hover:text-spincut-gold transition-all duration-200">← Retour à l'accueil</Link>
          <span className="text-sm font-bold tracking-[0.2em] text-white">{LEGAL.tradeName}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <p className="text-spincut-gold text-xs font-semibold uppercase tracking-[0.3em]">Informations légales</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-spincut-subtle">Dernière mise à jour{NB}: {LEGAL.updatedAt}</p>
        {content}
      </main>

      <footer className="border-t border-spincut-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-spincut-subtle">
          <Link to="/mentions-legales" className="hover:text-spincut-gold transition-all duration-200">Mentions légales</Link>
          <Link to="/confidentialite" className="hover:text-spincut-gold transition-all duration-200">Politique de confidentialité</Link>
        </div>
      </footer>
    </div>
  )
}
