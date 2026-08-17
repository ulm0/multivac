# Quickstart: get the notice on purpose

## See all three

```sh
d=$(mktemp -d) && cd "$d" && git init -q . && mvac init . --quiet
cat .multivac/projected.yml            # version: <the binary that made it>

# yellow — the record disagrees
sed -i '' 's/version: .*/version: 0.0.1/' .multivac/projected.yml
mvac doctor 2>&1 | head -2

# yellow, mildest — no record at all (every brain that exists today)
rm .multivac/projected.yml
mvac doctor 2>&1 | head -2

# red — under the floor this team declared
mvac init . --quiet >/dev/null
printf '\nrequires: ">=99.0.0"\n' >> .multivac/config.yml
mvac doctor 2>&1 | head -2
```

## Nothing is refused *(gated)*

```sh
mvac verify ; echo "exit $?"      # the notice appears; the exit is verify's own
```

Under the floor, out of date, or in agreement — the exit code is identical. This
is SC-002 and the test measures it for every command in the registry, both
severities.

## Only the explicit act moves the record *(gated)*

```sh
cp .multivac/projected.yml /tmp/before
mvac doors                 # re-projects, does NOT record
diff /tmp/before .multivac/projected.yml && echo "unchanged — correct"
mvac doctor 2>&1 | head -1 # the notice is still there — correct

mvac doors --adopt         # re-projects AND records
mvac doctor 2>&1 | head -1 # silent — correct
```

The middle step is the whole design. If bare `doors` had restamped, the notice
would vanish for anyone who ran it for an unrelated reason, with the upgrade
never taken and the repository looking resolved.

## A malformed floor is refused, not ignored *(gated)*

```sh
sed -i '' 's/requires: .*/requires: "^0.3"/' .multivac/config.yml
mvac doctor 2>&1 | head -2      # refused, naming the accepted form >=X.Y.Z
```

Silently ignoring it would be MV-85's defect relocated into a config file.

## Colour off, notice intact *(by eye)*

```sh
NO_COLOR=1 mvac doctor 2>&1 | head -2
```

The words still carry the severity; colour only makes it faster to see.
