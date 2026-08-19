# Contract — what self-heal may do

1. It rewrites a `present` leg's glob, and only that.
2. A candidate must be the same KIND of file as the include says it is about —
   the include's own trailing extension — and must not be inside `.multivac/`.
3. Exactly one surviving candidate is a move. Zero or many is `broken`, with
   the candidates listed.
4. A non-heal caused by a fence says so. Silence would make the fence the same
   class of defect as the heal it prevents.
5. `--check` still turns every heal into a report.

# Contract — what is enumerated

A tracked path is file text or it is not listed. Symlinks and gitlinks are not
file text, and the two readers — working tree and ref — agree about that,
which is the whole point.
