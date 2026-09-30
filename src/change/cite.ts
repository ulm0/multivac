// MV-146. With an SDD in the brain, the why, the design and the tasks of a
// change live in the SDD's own files, and a change body that restates them is
// a second copy nobody keeps in step. Nothing linked an archived change file
// to its spec directory by machine. `change close` appends one line citing the
// directory, and `change new` says so up front, so the body is written to be
// cited rather than to repeat.
//
// Whether a body restates its spec is ungateable: a median of 17% of an
// archived body's words sit in an eight-word run shared with its spec
// directory, so no byte comparison tells a restatement from a summary. These
// lines are instruction and a pointer, never a check.

/**
 * `body` with one line citing `dir` appended, or `body` itself when it already
 * names `<dir>/`. Appended after the body as it stands — never trimmed — so
 * everything the body held is a byte prefix of what is archived (MV-89), and
 * running it twice writes the line once.
 */
export function citeSpec(body: string, dir: string, sdd: string): string {
  if (body.includes(`${dir}/`)) return body;
  return `${body}\nSpecified in \`${dir}/\` (${sdd}).\n`;
}

/** What `change new` tells the agent about the body, printed before the steps. */
export function citeLine(sdd: string): string {
  return (
    `sdd ${sdd}: the why, the design and the tasks go into its files — the change body keeps what it held ` +
    'while planned, or one sentence, and `change close` cites the directory; do not cite it yourself'
  );
}
