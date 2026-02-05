# Pro League Live Load Testing – Step-by-Step Setup Guide

Load tests are configured for the **Hockey Australia API** ([Swagger docs](https://hockey-backend-local-gah7dze6b0cxevar.australiaeast-01.azurewebsites.net/docs#/)).

---

## Step 1: API Base URL (already configured)

The default base URL is set to:
```
https://hockey-backend-local-gah7dze6b0cxevar.australiaeast-01.azurewebsites.net
```

To use a different environment (e.g. staging), set:
```bash
export BASE_URL=https://your-other-api-url.com
```

---

## Step 2: Set the Base URL in the Project

**Option A – Environment variable (recommended for quick changes):**

1. Open Terminal.
2. Navigate to the project:
   ```bash
   cd /Users/shishirk/Hockey_load_testing
   ```
3. Set the variable (replace with your actual URL):
   ```bash
   export BASE_URL=https://your-api-url.com
   ```
4. Confirm:
   ```bash
   echo $BASE_URL
   ```
   You should see your URL printed.

**Option B – Edit the config file (permanent):**

1. Open `load-tests/config.js` in your editor.
2. Find this line:
   ```js
   baseUrl: __ENV.BASE_URL || 'https://api.example.com',
   ```
3. Change it to your URL:
   ```js
   baseUrl: __ENV.BASE_URL || 'https://api.proleague.hockey.org.au',
   ```
4. Save the file.

---

## Step 3: Discover Your Real API Endpoints

The load tests need the actual API paths your app uses. You can find them in two ways.

### Method A: From API Documentation (if you have it)

1. Ask your backend team for Swagger/OpenAPI docs or a Postman collection.
2. Note the endpoints for:
   - List matches
   - Match details
   - Live scores
   - Standings
   - Any other core features
3. Write down the full path for each (e.g. `/v1/matches`, `/api/scores/live`).

### Method B: Capture Traffic from the App (if no docs)

**On macOS (for an iOS device or Android emulator):**

1. **Install mitmproxy:**
   ```bash
   brew install mitmproxy
   ```

2. **Start mitmproxy:**
   ```bash
   mitmproxy
   ```

3. **Configure your device to use the proxy:**
   - **iPhone:** Settings → Wi‑Fi → (i) on your network → Configure Proxy → Manual → enter your Mac’s IP (e.g. `192.168.1.100`) and port `8080`
   - **Android emulator:** Set HTTP proxy in emulator settings to your Mac’s IP and port `8080`

4. **Use the Pro League Live app** – browse matches, scores, standings.

5. **Watch mitmproxy** – you’ll see HTTP requests. Note:
   - Base URL (e.g. `https://api.example.com`)
   - Paths (e.g. `/v1/matches`, `/v1/scores/live`)
   - Method (usually GET)

6. **Stop mitmproxy** with `q` when done.

7. **Turn off the proxy** on your device when finished.

---

## Step 4: Update the Load Test Scripts with Your Endpoints

Once you know your real endpoints, update the load test scripts.

1. Open `load-tests/main.js` in your editor.

2. Find the `ENDPOINTS` object (around lines 14–22):
   ```js
   const ENDPOINTS = {
     matches: `${BASE_URL}/api/matches`,
     matchDetail: (id) => `${BASE_URL}/api/matches/${id}`,
     liveScores: `${BASE_URL}/api/scores/live`,
     standings: `${BASE_URL}/api/standings`,
     schedule: `${BASE_URL}/api/schedule`,
     teams: `${BASE_URL}/api/teams`,
   };
   ```

3. Change each path to match your API. Examples:
   - If matches are at `/v1/matches`: use `matches: `${BASE_URL}/v1/matches``
   - If live scores are at `/api/live`: use `liveScores: `${BASE_URL}/api/live``
   - If standings are at `/v2/standings`: use `standings: `${BASE_URL}/v2/standings``

4. If you don’t have some endpoints, comment them out or remove those calls from the script.

5. Save the file.

6. Do the same for `load-tests/smoke-test.js` and `load-tests/spike-test.js` if they use different paths.

---

## Step 2: Add Authentication (if your API requires it)

The Hockey Australia API Swagger docs don't show auth. If your deployment requires a token:

1. Open `load-tests/main.js`.
2. Add headers and pass them to each `http.get()` call (see README).
3. Run with: `export AUTH_TOKEN=your-token; k6 run load-tests/main.js`

---

## Step 3: Run a Smoke Test First

A smoke test uses few users and a short duration to confirm everything works.

1. Open Terminal.

2. Go to the project:
   ```bash
   cd /Users/shishirk/Hockey_load_testing
   ```

3. If using env vars, set them:
   ```bash
   export BASE_URL=https://your-api-url.com
   export AUTH_TOKEN=your-token   # only if needed
   ```

4. Run the smoke test:
   ```bash
   k6 run load-tests/smoke-test.js
   ```

5. Check the output:
   - If you see `✓ health status 200` and `✓ leagues status 200`, the smoke test passed.
   - If you see connection errors or 404s, check that the API is reachable.

---

## Step 4: Run the Main Load Test

Once the smoke test passes:

1. Run the main load test:
   ```bash
   k6 run load-tests/main.js
   ```

2. This runs for about 5 minutes with 50 virtual users.

3. At the end you’ll see:
   - `http_req_duration` – response times
   - `http_req_failed` – failure rate
   - `checks` – how many checks passed

4. The test fails if thresholds are broken (e.g. p95 > 2s or > 1% failures).

---

## Step 5: Run the Spike Test (optional)

The spike test simulates a sudden traffic spike:

1. Run:
   ```bash
   k6 run load-tests/spike-test.js
   ```

2. It ramps up to 200 users and runs for about 5 minutes.

3. Use this to see how your API behaves under a sudden load increase.

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health check |
| `GET /leagues?status=active` | List active leagues |
| `GET /matches?league_id=...` | List matches |
| `GET /matches/{id}` | Match details |
| `GET /matches/{id}/score` | Live match score |
| `GET /points-table?league_id=...&category=men` | Standings |
| `GET /players` | List players |

## Quick Reference – Commands

```bash
cd /Users/shishirk/Hockey_load_testing

# Optional: use a different API URL
export BASE_URL=https://your-api-url.com

# Run tests in order
k6 run load-tests/smoke-test.js     # Quick check (~30s)
k6 run load-tests/main.js           # Full load test (~5min)
k6 run load-tests/spike-test.js     # Spike test (~5min)
```

---

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| Connection refused | Check `BASE_URL`, ensure the API is reachable from your network |
| 404 Not Found | Update endpoint paths in `main.js` and `smoke-test.js` |
| 401 Unauthorized | Add `Authorization` header (see Step 5) |
| SSL certificate errors | Run k6 with `--insecure-skip-tls-verify` (only for testing) |
| Tests run against wrong URL | Confirm `echo $BASE_URL` and/or `load-tests/config.js` |

---

## File Checklist

- [x] `load-tests/config.js` – Base URL set (Hockey Australia API)
- [x] `load-tests/main.js` – Endpoints configured from Swagger
- [x] `load-tests/smoke-test.js` – Health + leagues
- [x] `load-tests/spike-test.js` – Leagues, matches, points, health
- [ ] Authentication added (if your API requires it)
