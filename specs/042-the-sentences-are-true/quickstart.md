# Quickstart — proving the sentences are true

```sh
T=$(mktemp -d) && cd "$T" && git init -q . && mkdir -p .multivac
printf 'repos: [not a map\n' > .multivac/config.yml
# NOTE the ${=c}: zsh does not word-split an unquoted parameter, and a loop
# without it measures "unknown command" nine times (MV-85 records that probe).
for c in "verify" "count" "seed" "repos" "repos sync" "roadmap sync" "doors" "doctor"; do
  mvac ${=c} >/dev/null 2>&1; echo "$c exit=$?"
done
# before: seed=1 repos=1 "repos sync"=1 "roadmap sync"=1
# after:  all four =2, doors and doctor still 1

# and the law half of doctor's promise
printf '<!-- @anchor MV-99 brain:*.ts /[unclosed/ -->\n' >> .multivac/invariants.md
mvac doctor ; echo "exit=$?"     # before: 0. after: 1, naming the diagnostic
```
