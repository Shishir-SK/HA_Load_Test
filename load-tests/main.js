/**
 * Pro League Live - Main Load Test
 * Hockey Australia API - https://hockey-backend-local-gah7dze6b0cxevar.australiaeast-01.azurewebsites.net/docs
 *
 * Simulates user behavior: leagues → matches → scores → points table
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from './config.js';
import { createHandleSummary } from './reporter.js';

export const handleSummary = createHandleSummary('main-load');

const BASE_URL = config.baseUrl;

export const options = {
  insecureSkipTLSVerify: config.insecureSkipTLS,
  scenarios: {
    normal_load: config.scenarios.normal_load,
  },
  thresholds: config.thresholds,
};

export default function () {
  // 1. List leagues (entry point - gets active leagues)
  const leaguesRes = http.get(`${BASE_URL}/leagues?status=active`, {
    tags: { name: 'list_leagues' },
  });
  check(leaguesRes, {
    'leagues status 200': (r) => r.status === 200,
  });
  sleep(1);

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

  // 2. List matches (requires league_id)
  if (leagueId) {
    const matchesRes = http.get(`${BASE_URL}/matches?league_id=${leagueId}`, {
      tags: { name: 'list_matches' },
    });
    check(matchesRes, {
      'matches status 200': (r) => r.status === 200,
    });
    sleep(1);

    // 3. Get match details + score for first match
    if (matchesRes.status === 200) {
      try {
        const body = matchesRes.json();
        const matches = body?.data ?? body;
        const matchList = Array.isArray(matches) ? matches : matches?.items ?? [];
        if (matchList.length > 0) {
          const matchId = matchList[0].id ?? matchList[0].match_id;
          const detailRes = http.get(`${BASE_URL}/matches/${matchId}`, {
            tags: { name: 'get_match_detail' },
          });
          check(detailRes, {
            'match detail status 200': (r) => r.status === 200,
          });
          sleep(0.5);

          const scoreRes = http.get(`${BASE_URL}/matches/${matchId}/score`, {
            tags: { name: 'get_match_score' },
          });
          check(scoreRes, {
            'match score status 200': (r) => r.status === 200,
          });
          sleep(0.5);
        }
      } catch (_) {}
    }

    // 4. Points table (standings) - requires league_id and category
    const pointsRes = http.get(`${BASE_URL}/points-table?league_id=${leagueId}&category=men`, {
      tags: { name: 'get_points_table' },
    });
    check(pointsRes, {
      'points table status 200': (r) => r.status === 200,
    });
    sleep(0.5);

    const pointsWomenRes = http.get(`${BASE_URL}/points-table?league_id=${leagueId}&category=women`, {
      tags: { name: 'get_points_table_women' },
    });
    check(pointsWomenRes, {
      'points table women status 200': (r) => r.status === 200,
    });
  }

  // 5. List players (no required params)
  const playersRes = http.get(`${BASE_URL}/players`, {
    tags: { name: 'list_players' },
  });
  check(playersRes, {
    'players status 200': (r) => r.status === 200,
  });

  sleep(2);
}
