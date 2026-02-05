/**
 * k6 report generator - outputs HTML (print to PDF) and TXT for sharing
 */

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export function createHandleSummary(testName) {
  return function handleSummary(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const text = textSummary(data, { indent: ' ', enableColors: false });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pro League Live - Load Test Report</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 2rem; max-width: 900px; margin: 0 auto; line-height: 1.5; }
    h1 { color: #333; font-size: 1.5rem; margin-bottom: 0.5rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
    pre { background: #f6f8fa; padding: 1.5rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; border: 1px solid #e1e4e8; }
    @media print { body { padding: 1rem; } pre { white-space: pre-wrap; } }
  </style>
</head>
<body>
  <h1>Pro League Live – Load Test Report</h1>
  <p class="meta">Test: ${testName} | Generated: ${new Date().toISOString()}</p>
  <pre>${escapeHtml(text)}</pre>
  <p class="meta" style="margin-top: 2rem;">To save as PDF: File → Print → Save as PDF</p>
</body>
</html>`;

    return {
      stdout: textSummary(data, { indent: ' ', enableColors: true }),
      [`reports/${testName}-${timestamp}.html`]: html,
      [`reports/${testName}-${timestamp}.txt`]: text,
    };
  };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
