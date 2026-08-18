---
slug: publish-carries-no-provenance-from-a-self-hosted-runner
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-68
  adds:
    - MV-88
  retires: []
claims:
  - id: MV-88
    statement: The published tarball carries no provenance attestation while this project publishes from a self-hosted runner — the ceiling is stated in the pipeline and in the law, never left as a silent absence.
---

# publish carries no provenance from a self-hosted runner

The 0.6.0 release is blocked, and the block is not in this repository.

`v0.6.0` was tagged and the publish job ran to its last line. The OIDC
authentication SUCCEEDED — npm built the 47-file tarball, signed a provenance
statement and published it to the sigstore transparency log — and only then the
registry refused:

    npm error code E422
    npm error 422 Unprocessable Entity - PUT https://registry.npmjs.org/multivac
      - Error verifying sigstore provenance bundle: Unsupported GitLab CI runner
        environment: "self-hosted". Only "gitlab-hosted" runners are supported
        when publishing with provenance.

Nothing was published; the registry still serves 0.5.0. The tag was deleted,
because a tag naming no published version is exactly what MV-77 forbids the
site to advertise — the badge derives from `git describe`, so the next docs
merge would have announced an uninstallable release.

**Why a self-hosted runner at all.** The namespace's shared-runner minutes are
exhausted, and this project is on the free plan. The runner is what makes CI
run at all; it is not a preference to be reverted.

**What the failure proves and what it does not.** Trusted publishing over OIDC
works from this runner — authentication is not the problem, and MV-68's claim
that releases are published by trusted publishing and never by a long-lived
token survives untouched. What does not work is the registry's verification of
the provenance bundle, which npm's documentation confirms is limited to
gitlab.com shared runners, with self-hosted support planned and undated.

So the choice is: no releases, a token (which MV-68 forbids), or releases
without provenance. The third, with the loss written down where a reader meets
it — in the pipeline beside the flag, and in the law as MV-88 — rather than
left as an absence nobody would notice.
