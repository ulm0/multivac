// MV-139. The ecosystem's governance graph: how the declared repos, the law's
// rows, their anchors and the changes relate, rendered from the brain's own
// declarations into `.multivac/ecosystem.json`. The data was always here —
// config, law table, anchors, change files — and rendered nowhere; the brain's
// code graph held the law table as two nodes and no row.
//
// Derived, never authored, like flow.md: rewritten whole. Declarations only, so
// two machines render the same bytes: no presence on disk, no sha, no fetch
// age, and no row's text — a rule is said once, at its row (MV-111).
// Row ids appear, and they are right by construction: they come from this
// brain's own table, unlike a page rendered from the registry (MV-96).
//
// Not a code graph (DESIGN: no native code graph). Each repo node names that
// repo's own graph artifact rather than copying it. The shape is networkx's
// node-link, which graphify 0.9.29 reads through `--graph` offline.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { Config } from '../types.js';
import { CHANGES_DIR, CONFIG_PATH, DEFAULT_CHANNEL, ECOSYSTEM_PATH, LAW_PATH } from '../lib/config.js';
import { collectBrainAnchors, parseClaimRows } from '../anchor/parse.js';
import { parseChange } from '../change/file.js';
import { adapterFor } from '../adapters/detect.js';
import { grapherSpec } from '../adapters/registry.js';

type Attrs = Record<string, string | number | boolean | null>;
interface Link extends Attrs { source: string; target: string; relation: string }

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** The graph, as the bytes `.multivac/ecosystem.json` holds. */
export async function renderEcosystem(brain: string, cfg: Config): Promise<string> {
  const nodes = new Map<string, Attrs & { id: string }>();
  const links = new Map<string, Link>();
  const node = (id: string, a: Attrs): void => { if (!nodes.has(id)) nodes.set(id, { id, ...a }); };
  const link = (source: string, target: string, relation: string, a: Attrs = {}): void => {
    const k = `${source}\0${target}\0${relation}`;
    const had = links.get(k);
    if (had) had.legs = Number(had.legs ?? 1) + 1;
    else links.set(k, { source, target, relation, confidence: 'EXTRACTED', ...a });
  };
  const graphOf = (key: string): { grapher: string | null; graph: string | null } => {
    const g = adapterFor(cfg, key, 'grapher');
    return { grapher: g ?? null, graph: g ? grapherSpec(g, cfg.graphers)?.artifacts[0] ?? null : null };
  };

  const brainKey = Object.entries(cfg.repos).find(([, e]) => e.isBrain)?.[0];
  const repoId = (k: string): string => (k === brainKey ? 'repo:brain' : `repo:${k}`);
  const others = Object.keys(cfg.repos).filter((k) => !cfg.repos[k].isBrain).sort(cmp);
  node('repo:brain', { label: 'brain', file_type: 'repo', source_file: CONFIG_PATH, sdd: adapterFor(cfg, 'brain', 'sdd') ?? null, ...graphOf('brain') });
  for (const k of others) {
    const e = cfg.repos[k];
    node(`repo:${k}`, {
      label: k, file_type: 'repo', source_file: CONFIG_PATH, path: e.path, url: e.url ?? null, role: e.role ?? null,
      channel: e.channel ?? cfg.channel ?? DEFAULT_CHANNEL, sdd: adapterFor(cfg, k, 'sdd') ?? null, ...graphOf(k),
    });
    link('repo:brain', `repo:${k}`, 'declares');
    link(`repo:${k}`, 'repo:brain', 'mounts', { at: cfg.mount });
  }

  const law = await readFile(join(brain, LAW_PATH), 'utf8').catch(() => '');
  const lineOf = new Map<string, number>();
  law.split('\n').forEach((l, i) => {
    const m = /^\|\s*([A-Z]+-\d+)\s*\|/.exec(l);
    if (m && !lineOf.has(m[1])) lineOf.set(m[1], i + 1);
  });
  const rows = parseClaimRows(law);
  for (const r of rows) {
    node(`law:${r.id}`, { label: r.id, file_type: 'law', source_file: LAW_PATH, source_location: `L${lineOf.get(r.id) ?? 0}`, state: r.state, authority: r.authority });
  }
  const { anchors } = await collectBrainAnchors(brain);
  for (const a of anchors) {
    for (const k of a.repoKey === '*' ? ['brain', ...others] : [a.repoKey]) {
      const key = k === brainKey ? 'brain' : k;
      const g = `glob:${key}:${a.include}`;
      node(g, { label: `${key}:${a.include}`, file_type: 'anchor', source_file: a.include, repo: key });
      link(`law:${a.claimId}`, g, 'anchors', { mode: a.mode, source_file: a.file, source_location: `L${a.line}` });
      link(g, key === 'brain' ? 'repo:brain' : `repo:${key}`, 'in_repo');
    }
  }

  for (const dir of [CHANGES_DIR, `${CHANGES_DIR}/archive`]) {
    const names = (await readdir(join(brain, dir)).catch(() => [] as string[])).filter((n) => n.endsWith('.md')).sort(cmp);
    for (const n of names) {
      const rel = `${dir}/${n}`;
      let c;
      try {
        c = parseChange(await readFile(join(brain, rel), 'utf8'), rel).change;
      } catch {
        continue; // a broken change file is `change`'s diagnostic to raise
      }
      node(`change:${c.slug}`, { label: c.slug, file_type: 'change', source_file: rel, status: c.status, horizon: c.horizon ?? null, issue: c.issue ?? null });
      const stages = c.landing_order.length > 0 ? c.landing_order : [Object.keys(c.repos)];
      stages.forEach((st, i) => st.forEach((k) => link(`change:${c.slug}`, repoId(k), 'lands_in', { stage: i + 1, status: c.repos[k]?.status ?? null })));
      for (const cl of c.claims) link(`change:${c.slug}`, `law:${cl.id}`, 'claims');
      for (const rel2 of ['touches', 'adds', 'retires'] as const) for (const id of c.invariants[rel2]) link(`change:${c.slug}`, `law:${id}`, rel2);
    }
  }
  for (const r of rows) {
    const m = /\(([^)]*changes\/[^)]+\.md)\)/.exec(r.source);
    if (m) link(`law:${r.id}`, `change:${basename(m[1], '.md')}`, 'enacted_by');
  }

  const out = {
    directed: true,
    multigraph: false,
    graph: { generator: 'multivac', derived_from: [CONFIG_PATH, LAW_PATH, CHANGES_DIR] },
    nodes: [...nodes.values()].sort((a, b) => cmp(a.id, b.id)),
    // A link whose end is not declared — a change claiming a row not in the
    // table yet — is dropped rather than inventing the node.
    links: [...links.values()]
      .filter((l) => nodes.has(l.source) && nodes.has(l.target))
      .sort((a, b) => cmp(`${a.source}\0${a.target}\0${a.relation}`, `${b.source}\0${b.target}\0${b.relation}`)),
    hyperedges: [],
  };
  return `${JSON.stringify(out, null, 1)}\n`;
}

/** Render and write `.multivac/ecosystem.json`; true when its bytes changed. */
export async function writeEcosystem(brain: string, cfg: Config): Promise<boolean> {
  const next = await renderEcosystem(brain, cfg);
  const path = join(brain, ECOSYSTEM_PATH);
  if ((await readFile(path, 'utf8').catch(() => null)) === next) return false;
  await writeFile(path, next);
  return true;
}

/** The door line naming the graph, with graphify's `--graph` verbs where graphify resolves for `key`. */
export function ecosystemGraphLines(cfg: Config, key: string, prefix: string): string[] {
  const at = `${prefix}${ECOSYSTEM_PATH}`;
  const head = `- How the repos, the law's rows, their anchors and the changes relate is \`${at}\`, rendered from the brain's declarations`;
  return adapterFor(cfg, key, 'grapher') === 'graphify'
    ? [`${head}. Ask it: \`graphify query "<question>" --graph ${at}\`, \`graphify explain "<row id or change slug>" --graph ${at}\`, \`graphify path "<A>" "<B>" --graph ${at}\`.`]
    : [`${head}, as plain node-link JSON.`];
}
