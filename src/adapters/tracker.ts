// The tracker adapter: the roadmap, projected to an issue tracker. MV-99.
//
// The change files are the SOURCE. Issues are a projection of them and never a
// second source — a projection that reads back is two lists again, which is the
// failure the roadmap was built to end, moved one layer out. Closing an issue
// by hand therefore closes nothing; the next projection restores it, because
// the change file said so.
//
// The vendor's own CLI does the talking. It already solves authentication,
// hosts and enterprise installs; a client written here would add a dependency
// to do the same job worse, and would put credential handling in a tool whose
// whole claim is that it holds none.
//
// This reaches the network, so it runs from `roadmap sync` and NOWHERE ELSE —
// never from verify, doctor or doors, which MV-01 keeps offline. An `absent`
// leg on MV-99 is what keeps that true rather than remembered.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { onPath } from './detect.js';

const execFileP = promisify(execFile);

/** What multivac may write on an issue. Every other label is somebody else's. */
export const LABEL_PREFIX = 'multivac::';

export interface TrackerEntry {
  /** Binary that must be on PATH. */
  binary: string;
  /** Where to get it, printed when it is absent. */
  installHint: string;
  /** argv for "create an issue", minus title and body. */
  create: string[];
  /** argv for "edit issue <n>", minus the number. */
  edit: string[];
  /** argv for "close issue <n>", minus the number. */
  close: string[];
  /** How the created issue's number is read out of the tool's own output. */
  numberFrom: RegExp;
}

/**
 * Only what each vendor documents. A tracker absent from this table is
 * UNVERIFIED and gets no entry rather than a guessed one (Principle V).
 */
const known: Record<string, TrackerEntry> = {
  gitlab: {
    binary: 'glab',
    installHint: 'https://gitlab.com/gitlab-org/cli',
    create: ['issue', 'create', '--yes'],
    edit: ['issue', 'update'],
    close: ['issue', 'close'],
    // `glab issue create` prints the issue URL; the number is its last segment.
    numberFrom: /\/(?:issues|-\/issues)\/(\d+)/,
  },
  github: {
    binary: 'gh',
    installHint: 'https://cli.github.com',
    create: ['issue', 'create'],
    edit: ['issue', 'edit'],
    close: ['issue', 'close'],
    numberFrom: /\/issues\/(\d+)/,
  },
};

export const trackerNames: string[] = Object.keys(known);

export function trackerEntry(name: string): TrackerEntry | null {
  return known[name] ?? null;
}

export const NO_TRACKER = 'none';

export interface SyncResult {
  ok: boolean;
  /** The issue number, when one was created or already known. */
  issue?: number;
  line: string;
}

/** Refusal text when the declared tool is not installed. */
export function notInstalled(name: string, e: TrackerEntry): string[] {
  return [
    `sync refused — \`${e.binary}\` is not on PATH, so no issue can be created or updated`,
    `  install it (${e.installHint}), or drop \`tracker: ${name}\` from the config`,
    // A projection that cannot run must not report success — Principle II, and
    // the same rule the graph gate follows.
  ];
}

export const binaryReady = (e: TrackerEntry): Promise<boolean> => onPath(e.binary);

async function run(dir: string, e: TrackerEntry, argv: string[]): Promise<string> {
  const { stdout, stderr } = await execFileP(e.binary, argv, { cwd: dir });
  return `${stdout}${stderr}`;
}

/** Create an issue, returning its number read from the tool's own output. */
export async function createIssue(
  dir: string,
  e: TrackerEntry,
  title: string,
  body: string,
  label: string,
): Promise<number | null> {
  const out = await run(dir, e, [
    ...e.create,
    '--title',
    title,
    '--description',
    body,
    '--label',
    label,
  ]).catch(async () => {
    // GitHub's flag for the body is spelled differently; the entry declares the
    // verbs, and this is the one place the two vendors' flags diverge.
    return run(dir, e, [...e.create, '--title', title, '--body', body, '--label', label]);
  });
  const m = e.numberFrom.exec(out);
  return m ? Number(m[1]) : null;
}

/**
 * Bring an existing issue back to what the change file says.
 *
 * ADDS its own label and never removes one it does not own: teams label for
 * their own reasons, and a projection that reconciled the whole set would erase
 * that on every run. One wiped triage is enough to have this turned off
 * permanently, and then the drift it prevents comes straight back.
 */
export async function updateIssue(
  dir: string,
  e: TrackerEntry,
  n: number,
  title: string,
  label: string,
): Promise<void> {
  await run(dir, e, [...e.edit, String(n), '--title', title, '--label', label]);
}

export async function closeIssue(dir: string, e: TrackerEntry, n: number): Promise<void> {
  await run(dir, e, [...e.close, String(n)]);
}
