# Emir — projekti

Jedna stranica koja objedinjuje sve moje aplikacije. Astro (statički build), bez frameworka u browseru, ~0 KB JS osim malog filtera.

## Pokretanje

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # prvo povuče projekte sa Vercela, pa gradi u dist/
npm run lint     # ESLint + astro check (TypeScript)
```

## Kako se lista ažurira

1. **Automatski sa Vercela** — `scripts/sync-vercel.mjs` se pokreće prije svakog builda, čita sve projekte sa tvog Vercel naloga i upisuje ih u `src/data/vercel.json`. Svaki novi Vercel projekat se pojavi sam, sa oznakom „Novo".
2. **Opis projekta** — za lijep naziv, opis i status dodaj jedan JSON fajl u `src/content/projects/` (kopiraj postojeći). Polje `vercelProject` (ime projekta na Vercelu) ili `url` ga povezuje sa automatskim podacima. Schema u `src/content.config.ts` provjerava svaki fajl pri buildu.
3. **Projekti van Vercela** (npr. itdvoip na WP Engine, ideje) — samo JSON fajl, bez `vercelProject`.
4. **Sakrij projekat** — `"hidden": true` u JSON-u, ili dodaj ime u `VERCEL_EXCLUDE`.

Rešetka u zaglavlju raste sama: kad projekata bude više od slobodnih mjesta, dodaje se novi sloj kristala.

## Deploy na Vercel

1. Pushaj repo na GitHub i importuj ga na Vercel (framework se prepoznaje sam).
2. U Project → Settings → Environment Variables dodaj:
   - `VERCEL_TOKEN` — Account Settings → Tokens (dovoljan je read-only)
   - `VERCEL_TEAM_ID` — samo ako su projekti pod timom
   - `VERCEL_EXCLUDE` — npr. `emir-projekti` da se stranica ne prikazuje sama sebi
   - `SITE_URL` — javna adresa stranice
3. Dnevno osvježavanje: Settings → Git → Deploy Hooks → napravi hook, pa ga dodaj kao GitHub secret `VERCEL_DEPLOY_HOOK`. `.github/workflows/rebuild.yml` ga poziva svako jutro.

## Šta je unutra

- Content Collections sa Zod schemom (greška u JSON-u zaustavi build, ne pokvari stranicu)
- Font self-hostan (Bricolage Grotesque), bez poziva prema Googleu
- Sigurnosna zaglavlja i CSP, dugo keširanje assets-a (`vercel.json`)
- SEO: canonical, Open Graph, sitemap, robots.txt, JSON-LD lista aplikacija
- Pristupačnost: skip link, vidljiv fokus, `aria-pressed` filteri, `prefers-reduced-motion`, svijetla i tamna tema
- Radi i bez JavaScripta (filteri se tada sakriju, sve je vidljivo)

Osnovni tekstovi (ime, mjesto, kontakt) su u `src/site.ts`.
