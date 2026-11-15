import { getCollection } from 'astro:content';
import vercel from '../data/vercel.json';
import type { CATEGORIES, STATUSES } from '../content.config';
import { LANGS, ui, type Lang } from '../i18n';

export type Status = (typeof STATUSES)[number];
export type Category = (typeof CATEGORIES)[number] | 'ostalo';

export interface ProjectPage {
  title?: string;
  description?: string;
  h1?: string;
  body: string[];
  features: string[];
  note?: string;
}

interface VercelProject {
  name: string;
  url: string;
  domains?: string[];
  framework: string | null;
  repo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  /** Vanjska adresa žive aplikacije. */
  url?: string;
  host?: string;
  /** Adresa vlastite strane na ovom sajtu, ako je projekat opisan za nju. */
  href?: string;
  /** Slug po jeziku — za hreflang parove. */
  slugs?: Record<Lang, string>;
  /** Tekst vlastite strane na traženom jeziku. */
  page?: ProjectPage;
  status: Status;
  category: Category;
  stack: string[];
  audience?: string;
  featured: boolean;
  order: number;
  updatedAt?: string;
  video?: { src: string; poster: string; width: number; height: number; duration: number; uploadDate: string; title?: string };
  /** Pronađen na Vercelu, a još nije opisan u src/content/projects. */
  auto: boolean;
}

const frameworkLabel: Record<string, string> = {
  nextjs: 'Next.js',
  vite: 'Vite',
  astro: 'Astro',
  remix: 'Remix',
  sveltekit: 'SvelteKit',
  nuxtjs: 'Nuxt',
  'create-react-app': 'React',
};

const hostOf = (url?: string) => (url ? new URL(url).host.replace(/^www\./, '') : undefined);

const prettify = (slug: string) => {
  const s = slug.replace(/[-_]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Adresa strane projekta: /slug/ na bosanskom, /en/slug/ na engleskom. */
export const projectPath = (lang: Lang, slugs: Record<Lang, string>) =>
  lang === 'en' ? `/en/${slugs.en}/` : `/${slugs.bs}/`;

/**
 * Strana postoji samo za jezik na kojem ima napisan tekst — da engleska
 * adresa nikad ne prikaže bosanski tekst i da hreflang ne laže.
 */
const emptyPage: ProjectPage = { body: [], features: [] };
const pageFor = (lang: Lang, data: { page?: Partial<ProjectPage>; en: { page?: Partial<ProjectPage> } }) => {
  const own = (lang === 'en' ? data.en.page : data.page) ?? emptyPage;
  return { ...emptyPage, ...own } satisfies ProjectPage;
};
export const hasPage = (p: ProjectPage | undefined) => !!p && p.body.length > 0;

export async function getProjects(lang: Lang = 'bs'): Promise<Project[]> {
  const entries = await getCollection('projects');
  const remote = (vercel.projects ?? []) as VercelProject[];
  const used = new Set<string>();

  const findRemote = (vercelName?: string, url?: string) => {
    const host = hostOf(url);
    return remote.find(
      (r) =>
        (vercelName && r.name === vercelName) ||
        (host && (hostOf(r.url) === host || r.domains?.some((d) => d.replace(/^www\./, '') === host))),
    );
  };

  // Skriveni projekti i dalje "zauzmu" svoj Vercel projekat, da se ne pojave kao novi.
  const described: Project[] = entries.flatMap(({ id, data }) => {
    const r = findRemote(data.vercelProject, data.url);
    if (r) used.add(r.name);
    if (data.hidden) return [];
    const url = data.url ?? r?.url;
    const t = lang === 'en' ? data.en : ({} as Partial<typeof data.en>);
    const bsSlug = data.slug ?? id;
    const slugs = { bs: bsSlug, en: data.en.slug ?? bsSlug } satisfies Record<Lang, string>;
    const page = pageFor(lang, data);
    return {
      id,
      name: t.name ?? data.name,
      tagline: t.tagline ?? data.tagline,
      description: t.description ?? data.description,
      url,
      host: hostOf(url),
      href: hasPage(page) ? projectPath(lang, slugs) : undefined,
      slugs,
      page,
      status: data.status,
      category: data.category,
      stack: data.stack,
      audience: t.audience ?? data.audience,
      featured: data.featured,
      order: data.order,
      updatedAt: r?.updatedAt,
      video: data.video,
      auto: false,
    } satisfies Project;
  });

  const discovered: Project[] = remote
    .filter((r) => !used.has(r.name))
    .map((r) => ({
      id: r.name,
      name: prettify(r.name),
      tagline: ui[lang].autoTagline,
      url: r.url,
      host: hostOf(r.url),
      status: 'live' as const,
      category: 'ostalo' as const,
      stack: r.framework ? [frameworkLabel[r.framework] ?? r.framework] : [],
      featured: false,
      order: 1000,
      updatedAt: r.updatedAt,
      auto: true,
    }));

  return [...described, ...discovered].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, lang));
}

/**
 * Rute za strane projekata (getStaticPaths). Uz projekat vraća i
 * hreflang parove i tri srodna projekta za interno povezivanje.
 */
export async function getProjectPaths(lang: Lang) {
  const loaded = await Promise.all(LANGS.map(async (l) => [l, await getProjects(l)] as const));
  const byLang = Object.fromEntries(loaded) as Record<Lang, Project[]>;

  const pages = byLang[lang].filter(
    (p): p is Project & { slugs: Record<Lang, string>; page: ProjectPage } => !!p.slugs && hasPage(p.page),
  );

  return pages.map((p) => {
    const alternates: Partial<Record<Lang, string>> = {};
    for (const l of LANGS) {
      const twin = byLang[l].find((q) => q.id === p.id);
      if (twin?.slugs && hasPage(twin.page)) alternates[l] = projectPath(l, twin.slugs);
    }
    // Prvo isti kategorija, pa ostalo — da svaka strana ima tri izlaza.
    const sameCategory = pages.filter((q) => q.id !== p.id && q.category === p.category);
    const others = pages.filter((q) => q.id !== p.id && q.category !== p.category);
    return {
      params: { slug: lang === 'en' ? p.slugs.en : p.slugs.bs },
      props: { project: p, alternates, related: [...sameCategory, ...others].slice(0, 3) },
    };
  });
}

export const syncedAt: string | null = vercel.syncedAt;
