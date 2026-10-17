/**
 * Svi tekstovi interfejsa na oba jezika.
 * Novi jezik: dodaj ključ u LANGS i kopiraj jedan blok u `ui`.
 */
export const LANGS = ['bs', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'bs';

export const langMeta: Record<Lang, { label: string; short: string; locale: string; og: string; path: string }> = {
  bs: { label: 'Bosanski', short: 'BS', locale: 'bs', og: 'bs_BA', path: '/' },
  en: { label: 'English', short: 'EN', locale: 'en', og: 'en_US', path: '/en/' },
};

export const ui = {
  bs: {
    title: 'Emir Imamović — web aplikacije za iznajmljivače i firme',
    description:
      'Emir Imamović, Lukavac: web aplikacije za upravljanje apartmanima, TV ekran za goste, dizajner kuhinje, konfigurator plakara i berzu transporta.',
    ogAlt: 'Emir Imamović — aplikacije za iznajmljivače, majstore, firme i moj grad',
    notFound: {
      title: 'Stranica nije pronađena — Emir Imamović',
      h1: 'Ova stranica ne postoji.',
      text: 'Možda je adresa pogrešno upisana ili je stranica premještena. Svi projekti su na početnoj.',
      back: 'Idi na početnu',
    },
    place: 'Lukavac, Bosna i Hercegovina',
    home: 'Početna',
    skip: 'Preskoči na projekte',
    langSwitch: 'Jezik',
    h1: 'Aplikacije za iznajmljivače, majstore, firme i moj grad.',
    lede: 'Sve što sam napravio, na jednom mjestu: od onih koje već svakodnevno koriste ljudi do onih na kojima tek radim.',
    projects: 'Projekti',
    filterBy: 'Filtriraj po oblasti',
    all: 'Sve',
    shown: (n: number) => `Prikazano projekata: ${n}`,
    status: { live: 'Radi', beta: 'Beta', 'u-izradi': 'U izradi', ideja: 'Ideja', novo: 'Novo' },
    category: {
      iznajmljivanje: 'Iznajmljivanje',
      alati: 'Alati',
      turizam: 'Turizam',
      telekom: 'Telefonija',
      transport: 'Transport',
      ostalo: 'Ostalo',
    },
    meta: { area: 'Oblast', stack: 'Tehnologija', address: 'Adresa', updated: 'Zadnja izmjena' },
    audience: 'Za koga',
    newWindow: '(otvara se u novom prozoru)',
    video: (name: string) => `${name}: promo video`,
    videoNote: (sec: number) => `Promo video · ${sec} s`,
    reel: {
      label: 'Video: od tačaka do kristala svih mojih aplikacija',
      soundOn: 'Uključi zvuk',
      soundOff: 'Isključi zvuk',
      pause: 'Pauziraj video',
      play: 'Pokreni video',
    },
    autoTagline: 'Novi projekat na Vercelu',
    autoNote: (id: string) => `Pronađen automatski na Vercelu. Opis dodaj u src/content/projects/${id}.json.`,
    lattice: {
      label: (used: number, free: number) => `Rešetka projekata: ${used} zauzetih i ${free} slobodnih mjesta`,
      caption: 'Svaka kocka je jedan projekat, raspoređen kao ioni u kristalu soli. Prazna mjesta čekaju sljedeće.',
    },
    contact: {
      title: 'Imaš ideju za aplikaciju?',
      text: 'Pitanje, prijedlog ili želiš neku od ovih aplikacija za svoj posao? Javi se, rado ću pogledati.',
      send: 'Pošalji email',
      copy: 'Kopiraj adresu',
      copied: 'Adresa kopirana',
    },
    synced: 'Lista se osvježava sa Vercela. Zadnja provjera:',
    today: 'danas',
  },
  en: {
    title: 'Emir Imamović — Web Apps for Hosts and Businesses',
    description:
      'Web apps by Emir Imamović from Lukavac, Bosnia: rental management, a guest TV welcome screen, a kitchen designer, a wardrobe configurator and a freight marketplace.',
    ogAlt: 'Emir Imamović — apps for hosts, craftsmen, businesses and my hometown',
    notFound: {
      title: 'Page not found — Emir Imamović',
      h1: 'This page does not exist.',
      text: 'The address may be mistyped or the page has moved. All projects are on the home page.',
      back: 'Go to the home page',
    },
    place: 'Lukavac, Bosnia and Herzegovina',
    home: 'Home',
    skip: 'Skip to projects',
    langSwitch: 'Language',
    h1: 'Apps for hosts, craftsmen, businesses and my hometown.',
    lede: 'Everything I have built, in one place: from apps people already use every day to the ones I am still working on.',
    projects: 'Projects',
    filterBy: 'Filter by area',
    all: 'All',
    shown: (n: number) => `Projects shown: ${n}`,
    status: { live: 'Live', beta: 'Beta', 'u-izradi': 'In progress', ideja: 'Idea', novo: 'New' },
    category: {
      iznajmljivanje: 'Rentals',
      alati: 'Tools',
      turizam: 'Tourism',
      telekom: 'Telephony',
      transport: 'Transport',
      ostalo: 'Other',
    },
    meta: { area: 'Area', stack: 'Built with', address: 'Address', updated: 'Last updated' },
    audience: 'For',
    newWindow: '(opens in a new window)',
    video: (name: string) => `${name}: promo video`,
    videoNote: (sec: number) => `Promo video · ${sec} s`,
    reel: {
      label: 'Video: from dots to a crystal of all my apps',
      soundOn: 'Turn sound on',
      soundOff: 'Turn sound off',
      pause: 'Pause video',
      play: 'Play video',
    },
    autoTagline: 'New project on Vercel',
    autoNote: (id: string) => `Found automatically on Vercel. Add a description in src/content/projects/${id}.json.`,
    lattice: {
      label: (used: number, free: number) => `Project lattice: ${used} filled and ${free} open slots`,
      caption: 'Each cube is one project, arranged like ions in a salt crystal. Empty slots are waiting for the next ones.',
    },
    contact: {
      title: 'Got an idea for an app?',
      text: 'A question, a suggestion, or want one of these apps for your business? Get in touch and I will take a look.',
      send: 'Send an email',
      copy: 'Copy address',
      copied: 'Address copied',
    },
    synced: 'This list syncs from Vercel. Last checked:',
    today: 'today',
  },
} as const;

export type Dict = (typeof ui)[Lang];

/** Bosanska množina: 1 projekat, 2–4 projekta, 5+ projekata. */
function pluralBs(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/** "7 projekata" + "3 rade, 3 su u beta fazi, 1 je u pripremi" */
export function summary(lang: Lang, total: number, live: number, beta: number, later: number) {
  if (lang === 'en') {
    const parts = [live && `${live} live`, beta && `${beta} in beta`, later && `${later} in the works`];
    return { count: `${total} ${total === 1 ? 'project' : 'projects'}`, parts: parts.filter(Boolean).join(', ') };
  }
  const parts = [
    live && `${live} ${pluralBs(live, 'radi', 'rade', 'radi')}`,
    beta && `${beta} ${pluralBs(beta, 'je', 'su', 'je')} u beta fazi`,
    later && `${later} ${pluralBs(later, 'je', 'su', 'je')} u pripremi`,
  ];
  return {
    count: `${total} ${pluralBs(total, 'projekat', 'projekta', 'projekata')}`,
    parts: parts.filter(Boolean).join(', '),
  };
}

export function relativeDate(iso: string, lang: Lang, now = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat(langMeta[lang].locale, { numeric: 'auto' });
  const days = Math.round((new Date(iso).getTime() - now) / 86_400_000);
  if (Math.abs(days) < 1) return ui[lang].today;
  if (Math.abs(days) < 31) return rtf.format(days, 'day');
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), 'month');
  return rtf.format(Math.round(days / 365), 'year');
}
