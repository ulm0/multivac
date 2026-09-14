# Quickstart: prove the record earns its length

```sh
node -e 'const t=require("fs").readFileSync(".multivac/invariants.md","utf8").split("\n");
const c=id=>t.find(l=>l.startsWith("| "+id+" |")).split(" | ")[1];
const w=s=>s.trim().split(/\s+/).length;
console.log("MV-120", w(c("MV-120")));
for (const id of ["MV-14","MV-111"]) { const s=c(id); console.log(id+" note", w(s.slice(s.indexOf("**Amended 2026-09-13 by MV-120**")))); }'
# expect MV-120 ≤ 400, notes ≤ 60

node -e 'const s=require("fs").readFileSync("CHANGELOG.md","utf8").split(/^## /m).find(x=>x.startsWith("0.10.0"));
console.log(s.trim().split(/\s+/).length, [50,85,...Array.from({length:15},(_,i)=>105+i)].filter(n=>!new RegExp("MV-"+n+"\\b").test(s)))'
# expect ≤ 1500 and []

node dist/cli.js verify --strict       # 0 blocking broken
node --test "dist-test/**/*.test.js"   # all pass
```

Bite (scratch clone only): revert `DESIGN.md` to `38fbee0` → MV-120 `[absent]`,
exit 1. Drop the date from MV-111's note literal → MV-120 `[count] found 1`,
exit 1.
