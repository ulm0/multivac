# Quickstart — proving the sentences are true

```sh
T=$(mktemp -d) && cd "$T" && git init -q . && mkdir -p .multivac
printf 'repos: [not a map\n' > .multivac/config.yml
for c in verify count seed repos roadmap doors doctor; do
  mvac $c >/dev/null 2>&1; echo "$c exit=$?"
done
# before: seed=1 repos=1 roadmap=0
# after:  seed=2 repos=2 roadmap=2, doors and doctor still 1

# and the law half of doctor's promise
printf '<!-- @anchor MV-99 brain:*.ts /[unclosed/ -->\n' >> .multivac/invariants.md
mvac doctor ; echo "exit=$?"     # before: 0. after: 1, naming the diagnostic
```
