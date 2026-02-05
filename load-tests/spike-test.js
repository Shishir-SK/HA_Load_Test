/**
 * Pro League Live - Spike Test
 * Hockey Australia API - simulates sudden traffic (e.g. match going live)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from './config.js';
import { createHandleSummary } from './reporter.js';

export const handleSummary = createHandleSummary('spike');

const BASE_URL = config.baseUrl;

export const options = {
  insecureSkipTLSVerify: config.insecureSkipTLS,
  scenarios: {
    spike: config.scenarios.spike,
  },
  thresholds: {
    http_req_duration: ['p(95)<90000'],  // Relaxed for 10000 VUs
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  // Get leagues first (needed for league_id)
  const leaguesRes = http.get(`${BASE_URL}/leagues?status=active`, {
    tags: { name: 'spike_leagues' },
  });
  check(leaguesRes, { 'leagues status 200': (r) => r.status === 200 });
  sleep(0.3);

  let leagueId = null;
  if (leaguesRes.status === 200) {
    try {
      const body = leaguesRes.json();
      const leagues = body?.data ?? body;
      const list = Array.isArray(leagues) ? leagues : leagues?.items ?? [];
      if (list.length > 0) {
        leagueId = list[0].id ?? list[0].league_id;
      }
    } catch (_) {}
  }

  if (leagueId) {
    // High-traffic endpoints during a live match
    const matchesRes = http.get(`${BASE_URL}/matches?league_id=${leagueId}`, {
      tags: { name: 'spike_matches' },
    });
    check(matchesRes, { 'matches status 200': (r) => r.status === 200 });
    sleep(0.2);

    const pointsRes = http.get(`${BASE_URL}/points-table?league_id=${leagueId}&category=men`, {
      tags: { name: 'spike_points' },
    });
    check(pointsRes, { 'points status 200': (r) => r.status === 200 });
  }

  // Health + players - no league_id needed
  const healthRes = http.get(`${BASE_URL}/health`, { tags: { name: 'spike_health' } });
  check(healthRes, { 'health status 200': (r) => r.status === 200 });
  sleep(0.5);
}
