import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

export const STATUSES = ['live', 'beta', 'u-izradi', 'ideja'] as const;
export const CATEGORIES = ['iznajmljivanje', 'alati', 'turizam', 'telekom', 'transport'] as const;

/**
 * Jedan projekat = jedan JSON fajl u src/content/projects/.
 * Novi projekat: kopiraj postojeći fajl, promijeni podatke, gotovo.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string().max(90),
    description: z.string(),
    url: z.url().optional(),
    /** Ime projekta na Vercelu — povezuje opis sa automatskim podacima. */
    vercelProject: z.string().optional(),
    status: z.enum(STATUSES),
    category: z.enum(CATEGORIES),
    stack: z.array(z.string()).default([]),
    audience: z.string().optional(),
    featured: z.boolean().default(false),
    /** Manji broj = više na listi. */
    order: z.number().default(100),
    since: z.number().int().optional(),
    hidden: z.boolean().default(false),
    /** Kratki promo video iz public/ (npr. /video/ime.mp4), najbolje 16:9. */
    video: z
      .object({
        src: z.string().startsWith('/'),
        poster: z.string().startsWith('/'),
        width: z.number().int().default(1280),
        height: z.number().int().default(720),
        /** Trajanje u sekundama. */
        duration: z.number().positive(),
        uploadDate: z.string(),
        title: z.string().optional(),
      })
      .optional(),
    /** Engleska verzija; prazna polja preuzimaju bosanski tekst. */
    en: z
      .object({
        name: z.string().optional(),
        tagline: z.string().max(90).optional(),
        description: z.string().optional(),
        audience: z.string().optional(),
      })
      .default({}),
  }),
});

export const collections = { projects };
