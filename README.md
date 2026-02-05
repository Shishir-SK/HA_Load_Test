# Pro League Live - Load Testing

Load tests for the **Pro League Live** (Hockey Australia) app backend APIs. These tests simulate user traffic to validate performance under load.

**API:** [Hockey Australia API](https://hockey-backend-local-gah7dze6b0cxevar.australiaeast-01.azurewebsites.net/docs#/)

**For QA:** See [LOAD_TESTING_QA_GUIDE.md](LOAD_TESTING_QA_GUIDE.md) for a full step-by-step playbook to replicate this setup for other applications (convert to PDF to share).

## Prerequisites

Install [k6](https://k6.io/docs/get-started/installation/):

```bash
# macOS (Homebrew)
brew install k6

# Or via direct download: https://k6.io/docs/get-started/installation/
```

## Quick Start

The default API URL is already set to the Hockey Australia backend. Run:

1. **Smoke test** (light load, ~30 seconds):

   ```bash
   k6 run load-tests/smoke-test.js
   ```

2. **Full load test** (~5 min, 50 users):

   ```bash
   k6 run load-tests/main.js
   ```

3. **Spike test** (sudden 2500 users):

   ```bash
   k6 run load-tests/spike-test.js
   ```

4. **Reports** – Each run saves to `reports/`:
   - `*.html` – HTML report (open in browser → **File → Print → Save as PDF** to share)
   - `*.txt` – Plain text report (share as-is or paste into a doc)

**Note:** TLS verification is skipped by default (Azure dev certs). For production with valid certs, set `INSECURE_SKIP_TLS=false`.

## Endpoints Covered

Tests use these Hockey Australia API endpoints:

- `GET /health` – Health check
- `GET /leagues?status=active` – List leagues
- `GET /matches?league_id=...` – List matches
- `GET /matches/{id}` – Match details
- `GET /matches/{id}/score` – Live score
- `GET /points-table?league_id=...&category=men|women` – Standings
- `GET /players` – List players

## Test Scenarios

| Test | Description | Duration |
|------|-------------|----------|
| `main.js` | Normal load – browse matches, scores, standings | 5 min |
| `smoke-test.js` | Smoke test – basic connectivity check | 30 sec |
| `spike-test.js` | Spike test – sudden 200 VUs, simulates match going live | 5 min |

## Configuration

Edit `load-tests/config.js` to adjust:

- `baseUrl` – API base URL
- `scenarios` – VUs (virtual users), duration, ramp-up
- `thresholds` – Pass/fail criteria (e.g. p95 < 2s)

## Example Output

```
     ✓ matches status 200
     ✓ match detail status 200
     ✓ live scores status 200
     ✓ standings status 200

     checks.........................: 98.5% ✓ 3940  ✗ 60
     http_req_duration..............: avg=245ms min=12ms med=180ms max=1.2s p(95)=520ms
     http_reqs......................: 1000  33.3/s
     vus............................: 50    min=50  max=50
```

## Tips

- Run against **staging** first, not production
- If your API uses auth, add headers in the scripts (e.g. `Authorization: Bearer <token>`)
- For different API structures, adjust `ENDPOINTS` in `main.js` to match your routes
