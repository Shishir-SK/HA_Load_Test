/**
 * Pro League Live - Smoke Test
 * Hockey Australia API - quick connectivity check
 */

import http from 'k6/http';
import { check } from 'k6';
import { config } from './config.js';
import { createHandleSummary } from './reporter.js';

export const handleSummary = createHandleSummary('smoke');

const BASE_URL = config.baseUrl;

export const options = {
  insecureSkipTLSVerify: config.insecureSkipTLS,
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Health check - simplest endpoint, no params
  const healthRes = http.get(`${BASE_URL}/health`, { tags: { name: 'health' } });
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
  });

  // List leagues - core read endpoint
  const leaguesRes = http.get(`${BASE_URL}/leagues?status=active`, { tags: { name: 'leagues' } });
  check(leaguesRes, {
    'leagues status 200': (r) => r.status === 200,
  });
}
