---
name: Dependency audit
about: Run pnpm audit to check for vulnerabilities
title: "Run pnpm audit and report vulnerabilities"
labels: ["dependencies", "security"]
assignees: "Copilot"
---

## Task

Run `pnpm audit --json` in this repository and report the results.

### Steps

1. Run `pnpm install` to ensure dependencies are installed
2. Run `pnpm audit --json` to check for known vulnerabilities
3. Report the findings as a comment summarizing the vulnerability count and severity breakdown
4. If vulnerabilities are found, create a PR that updates affected packages where possible using `pnpm update`

### Expected output

A summary of vulnerabilities found (count by severity: critical, high, moderate, low, info).
