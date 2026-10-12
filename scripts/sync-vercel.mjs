#!/usr/bin/env node
/**
 * Povlači listu projekata sa Vercel API-ja i upisuje ih u src/data/vercel.json.
 *
 * - Pokreće se automatski prije svakog `npm run build` (prebuild).
 * - Bez VERCEL_TOKEN-a ne radi ništa i ne ruši build: ostaje zadnji snimak.
 * - Projekti koje nisi opisao u src/content/projects/ ipak se prikazuju,
 *   sa osnovnim podacima i oznakom "novo".
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = resolve(root, 'src/data/vercel.json');

// Lokalno učitaj .env ako postoji (na Vercelu varijable već postoje).
if (existsSync(resolve(root, '.env'))) {
  try {
    process.loadEnvFile(resolve(root, '.env'));
  } catch {
    /* ignoriši neispravan .env */
  }
}

const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_TEAM_ID;
const exclude = new Set(
  (process.env.VERCEL_EXCLUDE ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

async function ensureFile() {
  if (!existsSync(outFile)) {
    await mkdir(dirname(outFile), { recursive: true });
    await writeFile(outFile, JSON.stringify({ syncedAt: null, projects: [] }, null, 2) + '\n');
  }
}

function hostsOf(p) {
  return [
    ...(p.targets?.production?.alias ?? []),
    ...(p.alias ?? []).map((a) => (typeof a === 'string' ? a : a.domain)),
  ].filter(Boolean);
}

/** Preferiraj vlastitu domenu, pa najkraću *.vercel.app adresu. */
function pickUrl(p) {
  const aliases = hostsOf(p);
  const custom = aliases.find((a) => !a.endsWith('.vercel.app'));
  const vercel = aliases.filter((a) => a.endsWith('.vercel.app')).sort((a, b) => a.length - b.length)[0];
  const host = custom ?? vercel ?? `${p.name}.vercel.app`;
  return `https://${host}`;
}

async function fetchAll() {
  const projects = [];
  let until;
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ limit: '100' });
    if (teamId) qs.set('teamId', teamId);
    if (until) qs.set('until', String(until));
    const res = await fetch(`https://api.vercel.com/v10/projects?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Vercel API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    projects.push(...data.projects);
    until = data.pagination?.next;
    if (!until) break;
  }
  return projects;
}

async function main() {
  await ensureFile();
  if (!token) {
    console.log('[sync-vercel] VERCEL_TOKEN nije postavljen — koristim postojeći snimak.');
    return;
  }
  try {
    const raw = await fetchAll();
    const projects = raw
      .filter((p) => !exclude.has(p.name))
      .map((p) => ({
        name: p.name,
        url: pickUrl(p),
        domains: [...new Set(hostsOf(p))],
        framework: p.framework ?? null,
        repo: p.link?.repo ?? null,
        createdAt: new Date(p.createdAt).toISOString(),
        updatedAt: new Date(p.updatedAt).toISOString(),
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const previous = JSON.parse(await readFile(outFile, 'utf8'));
    await writeFile(outFile, JSON.stringify({ syncedAt: new Date().toISOString(), projects }, null, 2) + '\n');
    const added = projects.filter((p) => !previous.projects?.some((q) => q.name === p.name));
    console.log(`[sync-vercel] ${projects.length} projekata${added.length ? `, novi: ${added.map((p) => p.name).join(', ')}` : ''}.`);
  } catch (err) {
    // Nikad ne ruši build zbog API-ja — stranica ide sa zadnjim snimkom.
    console.warn(`[sync-vercel] Upozorenje: ${err.message}`);
  }
}

await main();
