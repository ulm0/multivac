// Vendor output recorded on 2026-09-14 (MV-123), for the tests that quote a
// failure and the stubs that reproduce one. Recorded against real binaries with
// HOME isolated and a constructed PATH; home paths read /home/user and the
// wrapped working path reads /tmp/repo. No other line is changed, and spec-kit's
// cause stays on line 28 of its 34.
//
// A fixture kinder than the tool cannot catch what the tool's own output does:
// the quote these feed used to be the first three lines, which is spec-kit's
// logo and graphify's traceback header.

/** spec-kit 1.0.6's scaffold init WITHOUT `--ignore-agent-tools`, no `claude` on PATH: exit 1, nothing written. */
export const SPECKIT_106_NO_CLAUDE = {
  stdout: [
    "              ███████╗██████╗ ███████╗ ██████╗██╗███████╗██╗   ██╗              ",
    "              ██╔════╝██╔══██╗██╔════╝██╔════╝██║██╔════╝╚██╗ ██╔╝              ",
    "              ███████╗██████╔╝█████╗  ██║     ██║█████╗   ╚████╔╝               ",
    "              ╚════██║██╔═══╝ ██╔══╝  ██║     ██║██╔══╝    ╚██╔╝                ",
    "              ███████║██║     ███████╗╚██████╗██║██║        ██║                 ",
    "              ╚══════╝╚═╝     ╚══════╝ ╚═════╝╚═╝╚═╝        ╚═╝                 ",
    "                                                                                ",
    "               GitHub Spec Kit - Spec-Driven Development Toolkit                ",
    "",
    "Warning: Current directory is not empty (1 items)",
    "Template files will be merged with existing content and may overwrite existing ",
    "files",
    "--force supplied: skipping confirmation and proceeding with merge",
    "╭──────────────────────────────────────────────────────────────────────────────╮",
    "│                                                                              │",
    "│  Specify Project Setup                                                       │",
    "│                                                                              │",
    "│  Project         repo                                                        │",
    "│  Working Path    /tmp/repo                                                   │",
    "│                                                                              │",
    "│                                                                              │",
    "│                                                                              │",
    "│                                                                              │",
    "╰──────────────────────────────────────────────────────────────────────────────╯",
    "",
    "╭─────────────────────────── Agent Detection Error ────────────────────────────╮",
    "│                                                                              │",
    "│  claude not found                                                            │",
    "│  Install from: https://docs.anthropic.com/en/docs/claude-code/setup          │",
    "│  Claude Code is required to continue with this project type.                 │",
    "│                                                                              │",
    "│  Tip: Use --ignore-agent-tools to skip this check                            │",
    "│                                                                              │",
    "╰──────────────────────────────────────────────────────────────────────────────╯",
  ].join('\n') + '\n',
  stderr: '',
};

/** `graphify update .`, graphify 0.9.29, with graphify-out/ read-only: exit 1. */
export const GRAPHIFY_0929_READONLY = {
  stdout: [
    "Re-extracting code files in . (no LLM needed)...",
  ].join('\n') + '\n',
  stderr: [
    "Traceback (most recent call last):",
    "  File \"/home/user/.local/bin/graphify\", line 10, in <module>",
    "    sys.exit(main())",
    "  File \"/home/user/.local/share/uv/tools/graphifyy/lib/python3.10/site-packages/graphify/__main__.py\", line 466, in main",
    "    _run_cli()",
    "  File \"/home/user/.local/share/uv/tools/graphifyy/lib/python3.10/site-packages/graphify/__main__.py\", line 712, in _run_cli",
    "    dispatch_command(cmd)",
    "  File \"/home/user/.local/share/uv/tools/graphifyy/lib/python3.10/site-packages/graphify/cli.py\", line 1908, in dispatch_command",
    "    ok = _rebuild_code(watch_path, force=force, no_cluster=no_cluster, block_on_lock=True)",
    "  File \"/home/user/.local/share/uv/tools/graphifyy/lib/python3.10/site-packages/graphify/watch.py\", line 907, in _rebuild_code",
    "    with _rebuild_lock(out, blocking=block_on_lock) as got:",
    "  File \"/home/user/.local/share/uv/python/cpython-3.10-macos-aarch64-none/lib/python3.10/contextlib.py\", line 135, in __enter__",
    "    return next(self.gen)",
    "  File \"/home/user/.local/share/uv/tools/graphifyy/lib/python3.10/site-packages/graphify/watch.py\", line 183, in _rebuild_lock",
    "    fh = open(lock_path, \"a+\", encoding=\"utf-8\")",
    "PermissionError: [Errno 13] Permission denied: 'graphify-out/.rebuild.lock'",
  ].join('\n') + '\n',
};

/**
 * `.specify/integration.json` as spec-kit 0.16.4 wrote it into this brain,
 * verbatim (MV-124). spec-kit 1.0.6's init writes the same two keys the probe
 * checks. A stub standing for an installed speckit writes THIS, never a bare
 * `.specify/`: the directory alone is what `mkdir` leaves, not an install.
 */
export const SPECKIT_INTEGRATION_JSON = [
  '{',
  '  "version": "0.16.4",',
  '  "integration_state_schema": 1,',
  '  "installed_integrations": [',
  '    "claude"',
  '  ],',
  '  "integration_settings": {',
  '    "claude": {',
  '      "script": "sh",',
  '      "invoke_separator": "-"',
  '    }',
  '  },',
  '  "integration": "claude",',
  '  "default_integration": "claude"',
  '}',
].join('\n') + '\n';
