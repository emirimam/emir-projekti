import { getCollection } from 'astro:content';
import vercel from '../data/vercel.json';
import type { CATEGORIES, STATUSES } from '../content.config';

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

export const statusLabel: Record<Status, string> = {
  live: 'Radi',
  beta: 'Beta',
  'u-izradi': 'U izradi',
  ideja: 'Ideja',
};

export const categoryLabel: Record<Category, string> = {
  iznajmljivanje: 'Iznajmljivanje',
  alati: 'Alati',
  turizam: 'Turizam',
  telekom: 'Telefonija',
  transport: 'Transport',
  ostalo: 'Ostalo',
};

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

export async function getProjects(): Promise<Project[]> {
  const entries = (await getCollection('projects')).filter((e) => !e.data.hidden);
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

  const described: Project[] = entries.map(({ id, data }) => {
    const r = findRemote(data.vercelProject, data.url);
    if (r) used.add(r.name);
    const url = data.url ?? r?.url;
    return {
      id,
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      url,
      host: hostOf(url),
      status: data.status,
      category: data.category,
      stack: data.stack,
      audience: data.audience,
      featured: data.featured,
      order: data.order,
      updatedAt: r?.updatedAt,
      auto: false,
    };
  });

  const discovered: Project[] = remote
    .filter((r) => !used.has(r.name))
    .map((r) => ({
      id: r.name,
      name: prettify(r.name),
      tagline: 'Novi projekat na Vercelu',
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

  return [...described, ...discovered].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'bs'));
}

export const syncedAt: string | null = vercel.syncedAt;

const rtf = new Intl.RelativeTimeFormat('bs', { numeric: 'auto' });

export function relativeDate(iso: string, now = Date.now()): string {
  const days = Math.round((new Date(iso).getTime() - now) / 86_400_000);
  if (Math.abs(days) < 1) return 'danas';
  if (Math.abs(days) < 31) return rtf.format(days, 'day');
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), 'month');
  return rtf.format(Math.round(days / 365), 'year');
}
