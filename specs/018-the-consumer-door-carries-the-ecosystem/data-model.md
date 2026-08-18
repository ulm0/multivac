# Data Model: A door in a code repo names the ecosystem

## RepoEntry — one new optional field

| Field | Type | Change | Notes |
|---|---|---|---|
| `path` | string | unchanged | |
| `url` | string, optional | unchanged | |
| `grapher` | string, optional | unchanged | per-repo override |
| `sdd` | string, optional | unchanged | per-repo override |
| `channel` | string, optional | unchanged | |
| `role` | string, optional | **new** | one line saying what this repo is for; reduced to one line when declared across several |
| `isBrain` | boolean | unchanged | derived, not declared |

A role is never derived. Absent means the entry carries its path and nothing
else.

## The ecosystem list

Printed into every consumer door when more than one repository is declared.
Contains, in declaration order:

- one line for the brain's handle, naming where it is mounted — because that
  handle is usable in anchors and can never appear among the declared
  repositories;
- one line per declared repository, carrying its key, its path, its role when
  declared, and a marker on the one whose door this is.

Built from declarations only. A repository absent from disk still appears; the
door makes no filesystem check.

## The door's order

1. the mount refresh, with its reason
2. the law
3. the ecosystem list
4. the adapters that apply here — the SDD block, then the graph block
5. verify, and the change may cross repos

The refresh moves from second of four bullets to first of everything, because it
is the only instruction with an ordering requirement.
