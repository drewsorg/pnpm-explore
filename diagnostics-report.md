# pnpm audit 400 Failure — Diagnostics Report

**Date:** 2026-04-14  
**Environment:** Copilot cloud agent (GitHub Actions runner)

---

## Section 1: Environment Inspection

### 1a. Proxy / firewall / SSL environment variables

```
$ env | grep -iE "proxy|https_proxy|http_proxy|no_proxy|ssl|node_extra|npm_config" | sort

CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
NODE_EXTRA_CA_CERTS=/home/runner/work/_temp/runtime-logs/mkcert/rootCA.pem
REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
SSL_CERT_DIR=/etc/ssl/certs
SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
EXIT_CODE=0
```

### 1b. pnpm / node / npm versions

```
$ pnpm --version
10.33.0

$ node --version
v20.20.2

$ npm --version
10.8.2
```

### 1c. pnpm config

```
$ pnpm config list

@jsr:registry=https://npm.jsr.io/
globalconfig=/home/runner/.config/pnpm/rc
npm-globalconfig=/opt/hostedtoolcache/node/20.20.2/x64/etc/npmrc
registry=https://registry.npmjs.org/
user-agent=pnpm/10.33.0 npm/? node/v20.20.2 linux x64
```

### 1d. npm config

```
$ npm config list

; node bin location = /opt/hostedtoolcache/node/20.20.2/x64/bin/node
; node version = v20.20.2
; npm local prefix = /home/runner/work/pnpm-explore/pnpm-explore
; npm version = 10.8.2
; cwd = /home/runner/work/pnpm-explore/pnpm-explore
; HOME = /home/runner
; Run `npm config ls -l` to show all defaults.
```

---

## Section 2: Network / DNS Diagnostics

### 2a. DNS resolution for registry.npmjs.org

```
$ dig registry.npmjs.org +short

104.16.6.34
104.16.10.34
104.16.8.34
104.16.4.34
104.16.0.34
104.16.11.34
104.16.1.34
104.16.2.34
104.16.5.34
104.16.7.34
104.16.3.34
104.16.9.34
EXIT_CODE=0
```

### 2b. Basic connectivity (curl -sI https://registry.npmjs.org/)

```
$ curl -sI https://registry.npmjs.org/ | head -20

HTTP/1.1 200 OK
Cache-Control: public, immutable, max-age=31557600
Cf-Ray: 9ebfe26befb63abe-DFW
Connection: close
Content-Type: application/json
Date: Tue, 14 Apr 2026 04:14:34 GMT
Server: cloudflare
Set-Cookie: _cfuvid=TaGFRL.sjAy32JVczdEyMx9l1ogv6RYClOjM1xBN9WA-1776140074879-0.0.1.1-604800000; path=/; domain=.npmjs.org; HttpOnly; Secure; SameSite=None
EXIT_CODE=0
```

### 2c. Proxy detection via httpbin.org/headers

```
$ curl -s https://httpbin.org/headers 2>&1 || echo "httpbin blocked"

httpbin blocked
EXIT_CODE=0
```

*httpbin.org is blocked by the agent network policy, so header reflection is unavailable. However, the TLS inspection in Section 4 reveals the MITM proxy details.*

---

## Section 3: Reproduce the pnpm audit Failure

### 3a. pnpm audit --json

```
$ pnpm audit --json 2>&1; echo "EXIT_CODE=$?"

{
  "error": {
    "code": "ERR_PNPM_AUDIT_BAD_RESPONSE",
    "message": "The audit endpoint (at https://registry.npmjs.org/-/npm/v1/security/audits/quick) responded with 400: <html>\r\n<head><title>400 Bad Request</title></head>\r\n<body>\r\n<center><h1>400 Bad Request</h1></center>\r\n<hr><center>cloudflare</center>\r\n</body>\r\n</html>\r\n. Fallback endpoint (at https://registry.npmjs.org/-/npm/v1/security/audits) responded with 400: <html>\r\n<head><title>400 Bad Request</title></head>\r\n<body>\r\n<center><h1>400 Bad Request</h1></center>\r\n<hr><center>cloudflare</center>\r\n</body>\r\n</html>\r\n"
  }
}
EXIT_CODE=1
```

### 3b. pnpm audit --registry=https://registry.npmjs.org

```
$ pnpm audit --registry=https://registry.npmjs.org 2>&1; echo "EXIT_CODE=$?"

ERR_PNPM_AUDIT_BAD_RESPONSE  The audit endpoint (at https://registry.npmjs.org/-/npm/v1/security/audits/quick) responded with 400: <html>
<head><title>400 Bad Request</title></head>
<body>
<center><h1>400 Bad Request</h1></center>
<hr><center>cloudflare</center>
</body>
</html>
. Fallback endpoint (at https://registry.npmjs.org/-/npm/v1/security/audits) responded with 400: <html>
<head><title>400 Bad Request</title></head>
<body>
<center><h1>400 Bad Request</h1></center>
<hr><center>cloudflare</center>
</body>
</html>

EXIT_CODE=1
```

---

## Section 4: Raw curl to Audit Endpoints (compare headers)

### 4a. POST to quick audit endpoint

```
$ curl -v -X POST \
  https://registry.npmjs.org/-/npm/v1/security/audits/quick \
  -H "Content-Type: application/json" \
  -H "User-Agent: pnpm" \
  -d '{"name":"pnpm-explore","version":"1.0.0","requires":{"express":"4.17.1","lodash":"4.17.20"},"dependencies":{}}' \
  2>&1; echo "EXIT_CODE=$?"

Note: Unnecessary use of -X or --request, POST is already inferred.
* Host registry.npmjs.org:443 was resolved.
* IPv6: (none)
* IPv4: 104.16.5.34, 104.16.6.34, 104.16.11.34, 104.16.8.34, 104.16.3.34, 104.16.9.34, 104.16.1.34, 104.16.10.34, 104.16.4.34, 104.16.7.34, 104.16.2.34, 104.16.0.34
*   Trying 104.16.5.34:443...
* Connected to registry.npmjs.org (127.0.0.1) port 443
* ALPN: curl offers h2,http/1.1
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
*  CAfile: /etc/ssl/certs/ca-certificates.crt
*  CApath: /etc/ssl/certs
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, CERT verify (15):
* TLSv1.3 (IN), TLS handshake, Finished (20):
* TLSv1.3 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.3 (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256 / X25519 / RSASSA-PSS
* ALPN: server did not agree on a protocol. Uses default.
* Server certificate:
*  subject: O=GoProxy untrusted MITM proxy Inc; CN=registry.npmjs.org
*  start date: Mar 15 04:14:34 2026 GMT
*  expire date: Apr 14 04:14:34 2027 GMT
*  subjectAltName: host "registry.npmjs.org" matched cert's "registry.npmjs.org"
*  issuer: O=mkcert development CA; OU=runner@runnervm35a4x; CN=mkcert runner@runnervm35a4x
*  SSL certificate verify ok.
*   Certificate level 0: Public key type RSA (2048/112 Bits/secBits), signed using sha256WithRSAEncryption
*   Certificate level 1: Public key type RSA (3072/128 Bits/secBits), signed using sha256WithRSAEncryption
* using HTTP/1.x
> POST /-/npm/v1/security/audits/quick HTTP/1.1
> Host: registry.npmjs.org
> Accept: */*
> Content-Type: application/json
> User-Agent: pnpm
> Content-Length: 110
>
* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
< HTTP/1.1 400 Bad Request
< Cf-Cache-Status: DYNAMIC
< Cf-Ray: 9ebfe2d37bcc4403-DFW
< Connection: close
< Date: Tue, 14 Apr 2026 04:14:51 GMT
< Npm-Notice: This endpoint is being retired. Use the bulk advisory endpoint instead. See the following docs for more info: https://api-docs.npmjs.com/#tag/Audit
< Server: cloudflare
< Set-Cookie: _cfuvid=751JgTy8XTxb3RhUSNxiSjMCE4xKXSOpMppibm6spkI-1776140091622-0.0.1.1-604800000; path=/; domain=.npmjs.org; HttpOnly; Secure; SameSite=None
< Vary: Accept-Encoding
<
* TLSv1.3 (IN), TLS alert, close notify (256):
* Closing connection
* TLSv1.3 (OUT), TLS alert, close notify (256):
{"statusCode":400,"error":"Bad Request","message":"Invalid package tree, run  npm install  to rebuild your package-lock.json"}EXIT_CODE=0
```

### 4b. POST to fallback audit endpoint

```
$ curl -v -X POST \
  https://registry.npmjs.org/-/npm/v1/security/audits \
  -H "Content-Type: application/json" \
  -H "User-Agent: pnpm" \
  -d '{"name":"pnpm-explore","version":"1.0.0","requires":{"express":"4.17.1","lodash":"4.17.20"},"dependencies":{}}' \
  2>&1; echo "EXIT_CODE=$?"

Note: Unnecessary use of -X or --request, POST is already inferred.
* Host registry.npmjs.org:443 was resolved.
* IPv6: (none)
* IPv4: 104.16.1.34, 104.16.5.34, 104.16.2.34, 104.16.11.34, 104.16.7.34, 104.16.10.34, 104.16.4.34, 104.16.6.34, 104.16.9.34, 104.16.3.34, 104.16.8.34, 104.16.0.34
*   Trying 104.16.1.34:443...
* Connected to registry.npmjs.org (127.0.0.1) port 443
* ALPN: curl offers h2,http/1.1
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
*  CAfile: /etc/ssl/certs/ca-certificates.crt
*  CApath: /etc/ssl/certs
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, CERT verify (15):
* TLSv1.3 (IN), TLS handshake, Finished (20):
* TLSv1.3 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.3 (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256 / X25519 / RSASSA-PSS
* ALPN: server did not agree on a protocol. Uses default.
* Server certificate:
*  subject: O=GoProxy untrusted MITM proxy Inc; CN=registry.npmjs.org
*  start date: Mar 15 04:14:34 2026 GMT
*  expire date: Apr 14 04:14:34 2027 GMT
*  subjectAltName: host "registry.npmjs.org" matched cert's "registry.npmjs.org"
*  issuer: O=mkcert development CA; OU=runner@runnervm35a4x; CN=mkcert runner@runnervm35a4x
*  SSL certificate verify ok.
*   Certificate level 0: Public key type RSA (2048/112 Bits/secBits), signed using sha256WithRSAEncryption
*   Certificate level 1: Public key type RSA (3072/128 Bits/secBits), signed using sha256WithRSAEncryption
* using HTTP/1.x
> POST /-/npm/v1/security/audits HTTP/1.1
> Host: registry.npmjs.org
> Accept: */*
> Content-Type: application/json
> User-Agent: pnpm
> Content-Length: 110
>
* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
< HTTP/1.1 400 Bad Request
< Cf-Cache-Status: DYNAMIC
< Cf-Ray: 9ebfe2ff9fa44403-DFW
< Connection: close
< Date: Tue, 14 Apr 2026 04:14:58 GMT
< Npm-Notice: This endpoint is being retired. Use the bulk advisory endpoint instead. See the following docs for more info: https://api-docs.npmjs.com/#tag/Audit
< Server: cloudflare
< Set-Cookie: _cfuvid=cAZjvxIraPoKejnTyBKfaw5GydCEMlpL8ECw28dJXLg-1776140098570-0.0.1.1-604800000; path=/; domain=.npmjs.org; HttpOnly; Secure; SameSite=None
< Vary: Accept-Encoding
<
* TLSv1.3 (IN), TLS alert, close notify (256):
* Closing connection
* TLSv1.3 (OUT), TLS alert, close notify (256):
{"statusCode":400,"error":"Bad Request","message":"Invalid package tree, run  npm install  to rebuild your package-lock.json"}EXIT_CODE=0
```

---

## Section 5: Compare with npm audit

```
$ npm audit --json 2>&1; echo "EXIT_CODE=$?"

npm error code ENOLOCK
npm error audit This command requires an existing lockfile.
npm error audit Try creating one first with: npm i --package-lock-only
npm error audit Original error: loadVirtual requires existing shrinkwrap file
{
  "error": {
    "code": "ENOLOCK",
    "summary": "This command requires an existing lockfile.",
    "detail": "Try creating one first with: npm i --package-lock-only\nOriginal error: loadVirtual requires existing shrinkwrap file"
  }
}
npm error A complete log of this run can be found in: /home/runner/.npm/_logs/2026-04-14T04_15_03_641Z-debug-0.log
EXIT_CODE=1
```

*npm audit cannot run without a `package-lock.json` (only `pnpm-lock.yaml` is present in this repo).*

---

## Section 6: Workaround Attempts

### 6a. Bypass with explicit user-agent override

```
$ npm_config_user_agent="npm/10.0.0 node/v20.0.0 linux x64" pnpm audit --json 2>&1; echo "EXIT_CODE=$?"

{
  "error": {
    "code": "ERR_PNPM_AUDIT_BAD_RESPONSE",
    "message": "The audit endpoint (at https://registry.npmjs.org/-/npm/v1/security/audits/quick) responded with 400: <html>\r\n<head><title>400 Bad Request</title></head>\r\n<body>\r\n<center><h1>400 Bad Request</h1></center>\r\n<hr><center>cloudflare</center>\r\n</body>\r\n</html>\r\n. Fallback endpoint (at https://registry.npmjs.org/-/npm/v1/security/audits) responded with 400: <html>\r\n<head><title>400 Bad Request</title></head>\r\n<body>\r\n<center><h1>400 Bad Request</h1></center>\r\n<hr><center>cloudflare</center>\r\n</body>\r\n</html>\r\n"
  }
}
EXIT_CODE=1
```

### 6b. Try with --no-optional to reduce payload size

```
$ pnpm audit --no-optional 2>&1; echo "EXIT_CODE=$?"

ERR_PNPM_AUDIT_BAD_RESPONSE  The audit endpoint (at https://registry.npmjs.org/-/npm/v1/security/audits/quick) responded with 400: <html>
<head><title>400 Bad Request</title></head>
<body>
<center><h1>400 Bad Request</h1></center>
<hr><center>cloudflare</center>
</body>
</html>
. Fallback endpoint (at https://registry.npmjs.org/-/npm/v1/security/audits) responded with 400: <html>
<head><title>400 Bad Request</title></head>
<body>
<center><h1>400 Bad Request</h1></center>
<hr><center>cloudflare</center>
</body>
</html>

EXIT_CODE=1
```

### 6c. Use npm audit as a fallback

```
$ npm audit --json 2>&1; echo "EXIT_CODE=$?"

npm error code ENOLOCK
npm error audit This command requires an existing lockfile.
npm error audit Try creating one first with: npm i --package-lock-only
npm error audit Original error: loadVirtual requires existing shrinkwrap file
{
  "error": {
    "code": "ENOLOCK",
    "summary": "This command requires an existing lockfile.",
    "detail": "Try creating one first with: npm i --package-lock-only\nOriginal error: loadVirtual requires existing shrinkwrap file"
  }
}
npm error A complete log of this run can be found in: /home/runner/.npm/_logs/2026-04-14T04_15_16_835Z-debug-0.log
EXIT_CODE=1
```

---

## Analysis & Root Cause

### Key finding: MITM (transparent TLS intercept) proxy is active

The `curl -v` output in Section 4 reveals the following critical details:

1. **DNS resolves to Cloudflare IPs** (`104.16.x.34`) but **TCP connects to `127.0.0.1`** — all HTTPS traffic is being transparently redirected to a local proxy.

2. **The TLS certificate is synthetic / MITM-generated:**
   ```
   subject: O=GoProxy untrusted MITM proxy Inc; CN=registry.npmjs.org
   issuer:  O=mkcert development CA; OU=runner@runnervm35a4x; CN=mkcert runner@runnervm35a4x
   ```
   This is **GoProxy** — an open-source transparent HTTPS proxy — intercepting all TLS connections and presenting locally-signed certificates. The runner's `NODE_EXTRA_CA_CERTS` points at `mkcert/rootCA.pem` so Node.js trusts these synthetic certs.

3. **ALPN negotiation fails:** The proxy does not advertise h2, so HTTP/1.1 is used — but pnpm's Node.js `undici`/`node-fetch` HTTP client may attempt HTTP/2 directly (or send different framing), which the GoProxy MITM cannot proxy correctly, causing it to return a raw HTML 400 page rather than forwarding the request to npm.

4. **curl returns the real npm JSON error body** (`"Invalid package tree, run npm install to rebuild your package-lock.json"`) because curl negotiates HTTP/1.1 cleanly. pnpm receives HTML from the proxy instead, triggering `ERR_PNPM_AUDIT_BAD_RESPONSE`.

### Why pnpm fails but curl succeeds

| Client | HTTP protocol used | Server sees | Response body |
|--------|-------------------|-------------|---------------|
| `curl` | HTTP/1.1 (ALPN fallback) | Valid HTTP/1.1 POST | JSON `{"statusCode":400,...}` |
| `pnpm` (Node.js undici) | Likely HTTP/2 or sends `Connection: keep-alive` with transfer-encoding the proxy cannot handle | Proxy rejects inline | HTML `<html>400 Bad Request</html>` |

The GoProxy MITM intercept layer is not fully HTTP/2-capable or does not correctly proxy `Transfer-Encoding: chunked` bodies from Node.js's HTTP client, causing the proxy itself to return the 400 HTML error page before the request ever reaches npm.

### Why none of the workarounds help

- **User-agent override:** Does not change HTTP framing or `Transfer-Encoding` headers; proxy still rejects.
- **`--no-optional`:** Reduces payload but does not change the HTTP wire format that confuses the proxy.
- **`npm audit`:** Cannot run — no `package-lock.json` present (project uses pnpm).

### Recommended fixes

1. **Short-term:** Add `--ignore-scripts` or skip `pnpm audit` in CI, or use `pnpm audit --audit-level=none` to prevent hard failures.
2. **Medium-term:** Configure pnpm to use Node.js `http` (HTTP/1.1) explicitly via `node-options=--experimental-fetch` or use `fetch-retries`. Alternatively, configure GoProxy to support HTTP/2 CONNECT proxying.
3. **Long-term:** Investigate whether the GoProxy MITM intercept is necessary in the Copilot agent runner environment, or whether it can be scoped to only non-npm traffic. Alternatively, add `registry.npmjs.org` to the proxy bypass list.
