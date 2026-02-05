# Load Testing Guide for Mobile Applications

**QA Playbook for Backend API Load Testing**

---

## Document Information

| Field | Value |
|-------|-------|
| **Purpose** | Step-by-step guide for QA engineers to perform backend API load testing for mobile applications |
| **Case Study** | Pro League Live (Hockey Australia) – FIH Pro League app on App Store and Play Store |
| **Tools** | k6 (load testing), mitmproxy (optional, for API discovery) |
| **Last Updated** | 2026 |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Phase 1: API Discovery](#3-phase-1-api-discovery)
4. [Phase 2: Project Setup](#4-phase-2-project-setup)
5. [Phase 3: Configuration for Your Application](#5-phase-3-configuration-for-your-application)
6. [Phase 4: Running Tests](#6-phase-4-running-tests)
7. [Phase 5: Reports and Sharing](#7-phase-5-reports-and-sharing)
8. [Test Types Explained](#8-test-types-explained)
9. [Adapting for a Different Application](#9-adapting-for-a-different-application)
10. [Troubleshooting](#10-troubleshooting)
11. [Appendix: Pro League Live Reference](#11-appendix-pro-league-live-reference)
12. [Converting This Guide to PDF](#12-converting-this-guide-to-pdf)

---

## 1. Overview

### What is Load Testing?

Load testing simulates many concurrent users hitting your application's backend APIs to validate performance under realistic or peak traffic. For mobile apps, we test the **backend APIs** that the app communicates with—not the app UI itself.

### Why Test Mobile App Backends?

- Mobile apps rely on APIs for data (matches, scores, user accounts, etc.)
- A live event or launch can create sudden traffic spikes
- Identifying bottlenecks before production prevents outages

### Process Flow

```
API Discovery → Project Setup → Configuration → Run Tests → Generate Reports → Share
```

---

## 2. Prerequisites

### Required

| Tool | Purpose | Installation |
|------|---------|--------------|
| **k6** | Load testing engine | macOS: `brew install k6`<br>Others: [k6.io/docs/get-started/installation](https://k6.io/docs/get-started/installation/) |

### Optional (for API discovery when docs are unavailable)

| Tool | Purpose | Installation |
|------|---------|--------------|
| **mitmproxy** | Capture HTTP/HTTPS traffic from the app | `brew install mitmproxy` |

### Other Requirements

- Terminal (macOS, Linux, or Windows with WSL)
- Text editor (VS Code, Sublime, etc.)
- Mobile device (Android or iOS) on the same network as your computer—for proxy-based traffic capture

---

## 3. Phase 1: API Discovery

You need the **base URL** and **endpoint paths** your app's backend uses. Choose the method that applies.

### Method A: API Documentation Available

If your backend team provides Swagger, OpenAPI, or a Postman collection:

1. Open the API docs (e.g. `https://your-api.com/docs` or `https://your-api.com/openapi.json`)
2. Note the **base URL** (e.g. `https://api.example.com`)
3. List the **GET endpoints** for core flows (e.g. list items, item details, search)

**Pro League Live example:** Swagger UI at  
`https://hockey-backend-local-gah7dze6b0cxevar.australiaeast-01.azurewebsites.net/docs`

---

### Method B: No Documentation—Capture Traffic with mitmproxy

Use this when API docs are missing or incomplete.

#### Step 1: Install and Start mitmproxy

```bash
brew install mitmproxy
mitmproxy
```

mitmproxy listens on port **8080** by default.

#### Step 2: Find Your Computer's IP Address

On macOS:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Example: `172.16.200.34`

#### Step 3: Configure Proxy on Your Mobile Device

**Android:**
1. Settings → Wi-Fi → Long-press your network → Modify network / Advanced
2. Proxy: Manual
3. Hostname: `172.16.200.34` (your Mac's IP)
4. Port: `8080`

**iOS:**
1. Settings → Wi-Fi → (i) next to your network
2. Configure Proxy → Manual
3. Server: `172.16.200.34`, Port: `8080`

#### Step 4: Install mitmproxy CA Certificate (for HTTPS)

1. On your Mac, open a browser and go to: **http://mitm.it**
2. Select **Android** or **iOS**
3. Download and install the certificate on your device
4. On Android: Settings → Security → Install from storage → select the `.crt` file
5. On iOS: Install the profile, then enable it in Settings → General → About → Certificate Trust Settings

#### Step 5: Capture Traffic

1. Use your mobile app (browse screens, load data)
2. Watch mitmproxy on your Mac—you'll see HTTP requests
3. Use arrow keys to select a request, **Enter** to view details
4. Note: **Host**, **Path**, **Method**, **Query params**, **Headers** (e.g. Authorization)

#### Step 6: Save Traffic (Optional)

```bash
mitmproxy -w traffic.log
```

Use the app, then stop mitmproxy with `q`.

#### Step 7: Disable Proxy When Done

On your device, set Proxy back to **None** to restore normal connectivity.

---

## 4. Phase 2: Project Setup

### Project Structure

Create or clone a load testing project with this layout:

```
your-load-test-project/
├── load-tests/
│   ├── config.js        # Base URL, VUs, thresholds
│   ├── main.js          # Main load scenario
│   ├── smoke-test.js    # Quick connectivity check
│   ├── spike-test.js    # Spike scenario
│   └── reporter.js      # HTML/TXT report generation
├── reports/             # Output directory (auto-created)
├── package.json         # Optional, for npm scripts
└── LOAD_TESTING_QA_GUIDE.md
```

### Key Files

| File | Purpose |
|------|---------|
| `config.js` | Central config: base URL, VUs, duration, thresholds |
| `main.js` | Constant-load scenario (e.g. 10000 users for 5 min) |
| `smoke-test.js` | Light load to verify connectivity |
| `spike-test.js` | Ramp-up/ramp-down to simulate traffic spikes |
| `reporter.js` | Generates HTML and TXT reports after each run |

---

## 5. Phase 3: Configuration for Your Application

### 5.1 Set Base URL

**Option A – Environment variable (temporary):**

```bash
export BASE_URL=https://your-api.example.com
```

**Option B – Edit config.js (permanent):**

```javascript
// In load-tests/config.js
baseUrl: __ENV.BASE_URL || 'https://your-api.example.com',
```

### 5.2 Update Endpoint Paths

In `main.js`, `smoke-test.js`, and `spike-test.js`, replace example paths with your real API paths.

### 5.3 Handle Dependencies Between Endpoints

Some endpoints need IDs from others (e.g. `league_id` from `/leagues`). Ensure your script calls the parent endpoint first, parses the response for IDs, then uses those IDs in subsequent calls.

### 5.4 TLS/SSL (Dev and Staging)

If your API uses self-signed or custom certificates:

```javascript
insecureSkipTLS: true,
```

### 5.5 Authentication

If your API requires a token, add headers to each request and run with `export AUTH_TOKEN=your-token`.

### 5.6 Adjust Load and Thresholds

In `config.js`: set `vus`, `duration`, `stages`, `http_req_duration` (e.g. p95 < 90s for heavy load), and `http_req_failed`.

---

## 6. Phase 4: Running Tests

### Order of Execution

1. **Smoke test** – verify connectivity
2. **Main load test** – sustained load
3. **Spike test** – sudden traffic increase

### Commands

```bash
cd /path/to/your-load-test-project
k6 run load-tests/smoke-test.js
k6 run load-tests/main.js
k6 run load-tests/spike-test.js
```

---

## 7. Phase 5: Reports and Sharing

Reports are saved to `reports/` as `.html` and `.txt`. Open the HTML in a browser, then **File → Print → Save as PDF** to share with developers.

---

## 8. Test Types Explained

| Test | Load Pattern | Purpose |
|------|--------------|---------|
| **Smoke** | 5 VUs, 30 sec | Connectivity, basic correctness |
| **Main load** | Constant VUs for 5 min | Sustained performance |
| **Spike** | 0 → VUs → 0 over 5 min | Sudden traffic increase |

---

## 9. Adapting for a Different Application

### Checklist

- [ ] Obtain or capture API base URL
- [ ] Obtain or capture endpoint paths and required parameters
- [ ] Update config.js (baseUrl, VUs, thresholds)
- [ ] Update main.js, smoke-test.js, spike-test.js with correct endpoints
- [ ] Add auth headers if needed
- [ ] Run smoke test first; fix any 404/401 before full load

---

## 10. Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection refused | Check base URL, verify API is reachable |
| 404 | Align endpoint paths with API |
| 401 | Add Authorization header |
| TLS errors | Set insecureSkipTLS: true for dev |
| Threshold failed | Relax thresholds or reduce VUs |

---

## 11. Appendix: Pro League Live Reference

- **API:** `https://hockey-backend-local-gah7dze6b0cxevar.australiaeast-01.azurewebsites.net`
- **Endpoints:** `/health`, `/leagues`, `/matches`, `/points-table`, `/players`
- **Config:** 10000 VUs, p95 < 90s, failure rate < 5%

---

## 12. Converting This Guide to PDF

1. **VS Code:** Install "Markdown PDF" extension → Right-click this file → Markdown PDF: Export (pdf)
2. **Pandoc:** `pandoc LOAD_TESTING_QA_GUIDE.md -o LOAD_TESTING_QA_GUIDE.pdf`
3. **Browser:** Render MD to HTML, then Print → Save as PDF

---

*End of guide*
