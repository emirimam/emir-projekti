import { getCollection } from 'astro:content';
import vercel from '../data/vercel.json';
import type { CATEGORIES, STATUSES } from '../content.config';
import { ui, type Lang } from '../i18n';

export type Status = (typeof STATUSES)[number];
export type Category = (typeof CATEGORIES)[number] | 'ostalo';

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
  url?: string;
  host?: string;
  status: Status;
  category: Category;
  stack: string[];
  audience?: string;
  featured: boolean;
  order: number;
  updatedAt?: string;
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
    const t = lang === 'en' ? data.en : {};
    return {
      id,
      name: t.name ?? data.name,
      tagline: t.tagline ?? data.tagline,
      description: t.description ?? data.description,
      url,
      host: hostOf(url),
      status: data.status,
      category: data.category,
      stack: data.stack,
      audience: t.audience ?? data.audience,
      featured: data.featured,
      order: data.order,
      updatedAt: r?.updatedAt,
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

export const syncedAt: string | null = vercel.syncedAt;
