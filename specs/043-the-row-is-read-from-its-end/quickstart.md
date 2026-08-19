# Quickstart — proving the row is read from its end

```sh
pnpm run build

# The corpus, both readings, side by side. Before: two rows disagree.
node -e '
const {parseClaimRows}=require("./dist/src/anchor/parse.js");
const t=require("fs").readFileSync(".multivac/invariants.md","utf8");
for(const r of parseClaimRows(t)) if(!["proposed","active","retired","drift"].includes(r.state))
  console.log("not a state:", r.id, JSON.stringify(r.state).slice(0,60));
'
# before: MV-108 "specified", MV-112 "true` → exit 0, everything on stdout; "
# after:  nothing printed

# The gate that found it: enact a batch and count the names.
git add .multivac/invariants.md && node dist/cli.js verify | grep enact
# before: twelve of fourteen. after: all of them.
```

The suite pins the same thing on a fixture whose body contains `|` and `||` —
the input that separates the two readings. A fixture without one cannot.
