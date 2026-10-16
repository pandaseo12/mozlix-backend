# MOZLIX backend for Bunny Magic Containers

Target repository: pandaseo12/mozlix-backend. This package prepares images; it does not deploy or prove IDLIX playback.

## Build

Upload all package files to the repository root, including .github/workflows/images.yml. GitHub Actions builds on pushes to main; it can also run manually from Actions. No personal token belongs in this repository. The workflow uses GitHub's automatic GITHUB_TOKEN with packages:write.

Images:
- ghcr.io/pandaseo12/mozlix-api:bunny-v1
- ghcr.io/pandaseo12/mozlix-stealth:bunny-v1

After a successful build, set BOTH packages to Public in GitHub Packages settings if using Bunny GitHub Public registry. A public repository does not automatically make its packages public.

## Bunny app

Use two containers in ONE application/pod. Bunny containers in the same pod communicate via localhost, unlike Docker Compose service DNS.

Stealth image: ghcr.io/pandaseo12/mozlix-stealth:bunny-v1
- Environment HEADLESS=true
- Internal service port 8191, no public endpoint.
- Disable inherited Docker healthcheck if it depends on wget; use Bunny HTTP health check /health on 8191.

API image: ghcr.io/pandaseo12/mozlix-api:bunny-v1
- NODE_ENV=production
- PORT=3000
- STEALTH_API_URL=http://127.0.0.1:8191
- IDLIX_BASE_URL=https://z2.idlixku.com
- CACHE_TTL_STREAM=0.000001
- MOZLIX_API_TOKEN=<generate a random 64-character lowercase hexadecimal secret>
- GATEWAY_PORT=3130
- INTERNAL_API_PORT=3000
- Expose ONLY gateway port 3130 via Bunny HTTPS endpoint. Do not expose port 3000 or 8191.

Token is NOT the GitHub personal access token. Generate it locally with openssl rand -hex 32 or a trusted password manager, and store it in Bunny's secret/environment settings. Never commit or post it. A healthy HTTP GET /api/ requires Authorization: Bearer TOKEN; a check without token returns 401 by design. Use a TCP health probe on 3130 if Bunny cannot attach an Authorization header.

Stealth launches a browser: resource limits, shared memory and sandbox compatibility must be tested on Bunny. Avoid scaling to many regions before validating one region. This package does not assert a supported memory minimum or successful live IDLIX extraction. Upstream image builds and Bunny execution have not been tested here; Docker Engine is unavailable locally.

## Connect website on Stellar Plus

Use the cPanel PHP package that supports external IDLIX_API_BASE, not the root-only cPanel VPS installer. Set its PRIVATE .env:

    IDLIX_API_BASE=https://YOUR-BUNNY-ENDPOINT
    IDLIX_API_TOKEN=THE-SAME-BACKEND-TOKEN
    ALLOW_STREAMING=true
    STREAM_PROXY=true

The /api prefix is added by the PHP adapter. Keep .env outside public_html. PHP relay bandwidth/resource limits on shared hosting still apply. Test catalog, a real movie, a real episode, then host/guest watch-party. Existing ZIP v2.3.0 install.sh is for root cPanel VPS and must not be run on Stellar Plus.

## Sources

IDLIX-API MIT source bundled at commit 25df283d2b4d61aa05678cd632125b033dc48422, preserving LICENSE. Stealth source is fetched at build from annurdien/stealth commit e664a0e4e2c46f5464bc74e97680e9fe82c52bb4; source is not bundled here.
