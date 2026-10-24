// Contract with backend-v2's nginx CSP: every inline <script> of index.html must have its 'sha256-...' source in the
// SPA's Content-Security-Policy(-Report-Only) header in backend-v2 deploy/nginx/qhhoj.conf.
// Usage: node scripts/deploy/check-csp-hash.mjs <index.html> <qhhoj.conf>
// A changed inline script lands its new hash in backend-v2 first (keeping the old one until this repo deploys).
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const [htmlPath, confPath] = process.argv.slice(2);
if (!htmlPath || !confPath) {
  console.error('usage: check-csp-hash.mjs <index.html> <qhhoj.conf>');
  process.exit(2);
}

// The hash covers the exact bytes between <script ...> and </script>; scripts with a src are not inline.
const inlineScripts = [
  ...readFileSync(htmlPath, 'utf8').matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g),
]
  .filter(([, attributes = '']) => !/\ssrc\s*=/.test(attributes))
  .map(([, , body]) => body);
const hashSource = (body) =>
  `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;
const conf = readFileSync(confPath, 'utf8');
const missing = inlineScripts.map(hashSource).filter((source) => !conf.includes(source));

if (missing.length) {
  console.error(
    `${confPath} lacks the CSP hash of ${missing.length} inline script(s) of ${htmlPath}: ${missing.join(' ')}\n` +
      'Add it to the script-src of the SPA location in backend-v2 deploy/nginx/qhhoj.conf (and on the host) first.',
  );
  process.exit(1);
}
console.log(`${inlineScripts.length} inline script hash(es) present in ${confPath}`);
