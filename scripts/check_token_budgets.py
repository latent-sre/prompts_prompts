#!/usr/bin/env python3
"""Deterministic token-budget gate for GitHub Copilot customizations.

Mirrors the budgets in the toolkit's authoring standard
(.github/skills/copilot-token-audit/references/authoring-standard.md). The LLM-driven
`/token-review` does the nuanced review; this script is the cheap, deterministic gate
that runs in CI (Copilot can't run there).

Fails (exit 1) if any customization file:
  - exceeds its est-token budget (tokens ~= chars / 4),
  - is an *.instructions.md without an `applyTo` frontmatter field, or
  - contains a secret-shaped pattern.

Skips examples/ (intentional fixtures) and skill references/ (no cap).

Usage:
  python3 scripts/check_token_budgets.py [path ...]   # default: repo root (.)
"""
import os
import re
import sys
import fnmatch

# (filename or glob, est-token budget). Order matters: first match wins.
BUDGETS = [
    ("copilot-instructions.md", 500),
    ("SKILL.md", 700),
    ("*.instructions.md", 300),
    ("*.prompt.md", 400),
    ("*.chatmode.md", 400),
    ("*.agent.md", 400),
]

SECRET_PATTERNS = [
    (re.compile(r"sk-[A-Za-z0-9_-]{8,}"), "OpenAI-style key"),
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS access key id"),
    (re.compile(r"://[^/\s:@]+:[^/\s:@]+@"), "credentials in URL"),
    (re.compile(r"(?i)\b(api[_-]?key|secret|password|token)\b\s*[:=]\s*['\"][^'\"]{6,}"),
     "inline secret value"),
]

SKIP_DIRS = {".git", "node_modules", "dist", "build", "examples"}


def est_tokens(text):
    return round(len(text) / 4)


def budget_for(name):
    for pattern, cap in BUDGETS:
        if name == pattern or fnmatch.fnmatch(name, pattern):
            return cap
    return None


def frontmatter(text):
    if not text.startswith("---"):
        return ""
    end = text.find("\n---", 3)
    return text[3:end] if end != -1 else ""


def iter_files(roots):
    for root in roots:
        if os.path.isfile(root):
            yield root
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in filenames:
                yield os.path.join(dirpath, fn)


def main(argv):
    roots = argv[1:] or ["."]
    failures = []
    checked = 0

    for path in iter_files(roots):
        cap = budget_for(os.path.basename(path))
        if cap is None:
            continue
        try:
            text = open(path, encoding="utf-8").read()
        except (UnicodeDecodeError, OSError):
            continue

        checked += 1
        tokens = est_tokens(text)
        status = "ok" if tokens <= cap else "OVER"
        print(f"[{status:>4}] {tokens:>5}/{cap}  {path}")

        if tokens > cap:
            failures.append(f"{path}: {tokens} est. tokens > budget {cap}")

        if fnmatch.fnmatch(os.path.basename(path), "*.instructions.md"):
            if "applyTo" not in frontmatter(text):
                failures.append(f"{path}: *.instructions.md missing `applyTo` in frontmatter")

        for pattern, label in SECRET_PATTERNS:
            if pattern.search(text):
                failures.append(f"{path}: possible secret ({label})")
                break

    print(f"\nchecked {checked} customization file(s)")
    if failures:
        print("\nBUDGET GATE FAILED:")
        for f in failures:
            print("  -", f)
        return 1
    print("BUDGET GATE PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
