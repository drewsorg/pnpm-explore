# pnpm-explore

A simple Node.js/Express web server that demonstrates using [pnpm](https://pnpm.io/) as a package manager. The app exposes a single HTTP endpoint that returns a JSON status response including the installed Lodash version.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later recommended)
- [pnpm](https://pnpm.io/installation) (v10 or later)

## Install Dependencies

```bash
pnpm install
```

## Run the App

```bash
node index.js
```

The server will start on port `3000` by default (override with the `PORT` environment variable):

```bash
PORT=8080 node index.js
```

Once running, visit [http://localhost:3000](http://localhost:3000) to see the response:

```json
{ "status": "ok", "lodashVersion": "4.17.20" }
```

## Known Issues

`pnpm audit` reports the following vulnerabilities in the current dependencies:

| Package | Severity | Advisory | Affected Versions | Patched Version |
|---------|----------|----------|-------------------|-----------------|
| lodash  | High     | [Command Injection in lodash](https://github.com/advisories/GHSA-35jh-r3h4-6jhm) | < 4.17.21 | 4.17.21 |
| lodash  | High     | [Code Injection via `_.template` imports key names](https://github.com/advisories/GHSA-p6mc-m468-83gw) | >= 4.0.0, < 4.18.0 | 4.18.0 |

**Recommended fix:** upgrade lodash to at least `4.17.21` to address the Command Injection vulnerability, or to `4.18.0` or later to address both vulnerabilities.
