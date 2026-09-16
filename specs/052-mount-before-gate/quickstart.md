# Quickstart — proving it end to end

Offline. No host configuration is read: `HOME` is a scratch directory, and the brain URL
is a local path, so the one git setting the submodule clone needs is set in that scratch
`HOME` — never on the developer's machine.

## Prerequisites

```bash
pnpm install && pnpm run build
export S=$(mktemp -d)
export HOME="$S/home" && mkdir -p "$HOME"
git config --global protocol.file.allow always   # scratch HOME only; see research.md
git config --global user.email t@example.com && git config --global user.name t
alias mvac="node $PWD/dist/cli.js"
```

## 1. An ecosystem whose consumer has no mount

```bash
cd "$S"
git init -q brain && (cd brain && echo '# law' > README.md && git add -A && git commit -qm init)
git init -q app   && (cd app   && echo 'x' > a.txt   && git add -A && git commit -qm init)
cd brain && mvac init . --quiet
# init already wrote `repos:` with `brain: .` (the brain has tracked source). Edit that
# key; appending a second `repos:` is invalid YAML and the loader refuses it.
python3 -c "import pathlib,sys;p=pathlib.Path('.multivac/config.yml');p.write_text(p.read_text().replace(sys.argv[1].encode().decode('unicode_escape'),sys.argv[2].encode().decode('unicode_escape'),1))" 'repos:\n  brain: .\n' 'brain_url: ../brain\nrepos:\n  brain: .\n  app: ../app\n'
git add -A && git commit -qm brain --no-verify
mvac doors
```

Expect: the door and hooks land in `../app`, and `doors` prints a `mounts` line naming
`app` as unverified until `multivac repos sync`.

## 2. The gate does not lock the repo (FR-001)

```bash
cd "$S/app" && mvac verify; echo "EXIT=$?"
echo 'y' > b.txt && git add -A && git commit -m "work"; echo "COMMIT=$?"
```

Expect: a warning that `app` was not verified and that no brain is mounted, `EXIT=0`, and
`COMMIT=0`. Before this change both are 2 and 1.

## 3. A repo with no door is unchanged (FR-002)

```bash
cd "$S" && git init -q plain && cd plain && mvac verify; echo "EXIT=$?"
```

Expect: `no .multivac/config.yml in <dir> — run `multivac init .` to create it`, `EXIT=2`.

## 4. The tool creates the mount (FR-004, FR-005)

```bash
cd "$S/brain" && mvac repos sync
cd "$S/app" && git status --short && git ls-files -s .brain && git log --oneline -1
```

Expect: `app: mounted the brain at .brain — staged …`; `A .brain` and `A .gitmodules` in
`git status`; a `160000` entry from `ls-files`; and the last commit is still `work` —
multivac committed nothing.

## 5. Now the gate judges

```bash
cd "$S/app" && mvac verify; echo "EXIT=$?"
```

Expect: `scoped to repo "app" · brain at …/.brain`, and the scoped claim count.

## 6. Running it twice is safe (research.md measurement 4)

```bash
cd "$S/brain" && mvac repos sync
```

Expect: `app: brain mounted at .brain — staged, commit it in that repo`. No failure, no
second `submodule add`.

## 7. The URL is never guessed (FR-007, FR-008)

```bash
cd "$S" && cp -R brain brain2 && cd brain2
sed -i.bak '/^brain_url:/d' .multivac/config.yml
git remote add origin git@some-local-alias:acme/brain.git
mvac repos sync
```

Expect: a line naming `brain_url`, `.multivac/config.yml`, and that multivac will not
guess it from a git remote. No submodule is added anywhere, and `some-local-alias`
appears in no `.gitmodules`.

## 8. A read-only repo is left alone (FR-006)

```bash
cd "$S/brain" && python3 -c "import pathlib,sys;p=pathlib.Path('.multivac/config.yml');p.write_text(p.read_text().replace(sys.argv[1].encode().decode('unicode_escape'),sys.argv[2].encode().decode('unicode_escape'),1))" '  app: ../app\n' '  app: ../app\n  vendor:\n    path: ../vendor\n    managed: false\n'
git init -q ../vendor && (cd ../vendor && echo v > v.txt && git add -A && git commit -qm init)
mvac repos sync
```

Expect: `vendor: not managed, read-only — no mount expected`, and no `.brain` in
`../vendor`.

## 9. A failure is quoted and does not stop the rest (FR-009)

```bash
cd "$S" && git init -q app2 && (cd app2 && echo z > z.txt && git add -A && git commit -qm init && mkdir .brain && echo junk > .brain/f)
cd brain && python3 -c "import pathlib,sys;p=pathlib.Path('.multivac/config.yml');p.write_text(p.read_text().replace(sys.argv[1].encode().decode('unicode_escape'),sys.argv[2].encode().decode('unicode_escape'),1))" '  app: ../app\n' '  app: ../app\n  app2: ../app2\n' && mvac repos sync; echo "EXIT=$?"
```

Expect: `app2: could not mount the brain at .brain — fatal: '.brain' already exists and is
not a valid git repo`, the `app` line still printed, and `EXIT=1`.

Walked 2026-09-16 against this build, with the hook shim reaching it through `PATH`: all
nine steps printed what is described above, and the step-2 commit went through with the
warning.

## Cleanup

```bash
rm -rf "$S"
```
