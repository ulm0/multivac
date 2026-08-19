# Contract — what the projection promises about its environment

1. A hook multivac installs runs the repo's own gate first, in every checkout
   shape git supports, and that gate's exit code wins.
2. A command an operator declares means what a shell says it means, on every
   runner that runs it.
3. A file multivac cannot safely edit is named and skipped. It never ends the
   run for the repos after it.
4. "Armed" means the gate runs multivac, whoever wrote the file.
5. Nothing here rewrites a hook multivac did not write.
