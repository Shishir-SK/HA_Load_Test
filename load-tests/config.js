/**
 * Load test configuration for Pro League Live backend APIs
 * Update BASE_URL with your staging/production API endpoint
 */

export const config = {
  baseUrl: __ENV.BASE_URL || 'https://hockey-backend-local-gah7dze6b0cxevar.australiaeast-01.azurewebsites.net',
  // Skip TLS verification (needed for Azure dev/staging with custom certs)
  insecureSkipTLS: __ENV.INSECURE_SKIP_TLS !== 'false',
  
  // Test scenarios
  scenarios: {
    // Simulate normal browsing - mixed read operations
    normal_load: {
      executor: 'constant-vus',
      vus: 10000,
      duration: '5m',
      startTime: '0s',
      gracefulStop: '30s',
    },
    // Spike test - sudden traffic surge
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10000 },
        { duration: '3m', target: 10000 },
        { duration: '1m', target: 0 },
      ],
      startTime: '0s',
      gracefulStop: '30s',
    },
  },
  
  // Thresholds - fail the test if these are exceeded (relaxed for 10000 VUs)
  thresholds: {
    http_req_duration: ['p(95)<90000'],  // 95% of requests under 90s (for 10000 users)
    http_req_failed: ['rate<0.05'],     // Less than 5% failure rate
    http_reqs: ['count>1000'],          // At least 1000 requests
  },
};
