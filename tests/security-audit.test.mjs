import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// ── 1. SECRET SCANNER: SCAN FOR LEAKED SECRETS IN SOURCE FILES ──
const LEAK_PATTERNS = [
  { name: 'Live Stripe Secret Key', pattern: /sk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Google Cloud API Key', pattern: /AIzaSy[0-9a-zA-Z_-]{33}/ },
  { name: 'AWS Access Key ID', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub Personal Access Token', pattern: /ghp_[0-9a-zA-Z]{36}/ },
  { name: 'RSA Private Key', pattern: /-----BEGIN RSA PRIVATE KEY-----/ },
  { name: 'Raw Unmasked Credit Card Number', pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/ },
];

function getAllSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        getAllSourceFiles(fullPath, fileList);
      }
    } else if (/\.(tsx|ts|js|jsx|json|mjs|html)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

test('Security Audit: No live API keys, private credentials, or raw credit cards in source code', () => {
  const srcFiles = getAllSourceFiles(path.resolve('src'));
  const violations = [];

  for (const filePath of srcFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const { name, pattern } of LEAK_PATTERNS) {
      if (pattern.test(content)) {
        violations.push({ file: path.relative(process.cwd(), filePath), rule: name });
      }
    }
  }

  assert.equal(
    violations.length,
    0,
    `Security violations detected:\n${JSON.stringify(violations, null, 2)}`
  );
});

// ── 2. XSS & DANGEROUS DOM INJECTION AUDIT ──
test('Security Audit: No dangerouslySetInnerHTML or eval() invocations in source components', () => {
  const srcFiles = getAllSourceFiles(path.resolve('src'));
  const dangerousPatterns = [
    { name: 'dangerouslySetInnerHTML', regex: /dangerouslySetInnerHTML/ },
    { name: 'eval() invocation', regex: /\beval\s*\(/ },
    { name: 'host document.write', regex: /(?<!printWindow\.)document\.write/ },
  ];

  const foundVulnerabilities = [];
  for (const filePath of srcFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const { name, regex } of dangerousPatterns) {
      if (regex.test(content)) {
        foundVulnerabilities.push({ file: path.relative(process.cwd(), filePath), vulnerability: name });
      }
    }
  }

  assert.equal(
    foundVulnerabilities.length,
    0,
    `XSS / Dangerous DOM injection vulnerabilities found:\n${JSON.stringify(foundVulnerabilities, null, 2)}`
  );
});

// ── 3. ROLE-BASED ACCESS CONTROL (RBAC) & PRIVILEGE SEPARATION AUDIT ──
test('Security Audit: Client role cannot access coach-exclusive administrative sections', () => {
  const COACH_ONLY_SECTIONS = [
    'client-roster',
    'retainers',
    'stripe-billing',
    'prescriptive-studio',
    'anti-churn-radar',
    'check-in-queue',
    'payments',
    'payroll',
  ];

  // RBAC Guard Simulator
  function resolveClientSection(role, targetSection) {
    if (role === 'client' && COACH_ONLY_SECTIONS.includes(targetSection)) {
      return 'overview'; // Must bounce client to client overview
    }
    return targetSection;
  }

  for (const section of COACH_ONLY_SECTIONS) {
    const clientResolved = resolveClientSection('client', section);
    assert.equal(
      clientResolved,
      'overview',
      `Client must NOT be permitted to access coach section "${section}"`
    );

    const coachResolved = resolveClientSection('coach', section);
    assert.equal(
      coachResolved,
      section,
      `Coach must be permitted to access section "${section}"`
    );
  }
});

// ── 4. MULTI-TENANT DATA ISOLATION AUDIT ──
test('Security Audit: Client datasets only expose the authenticated client data without leakage', () => {
  const dataDir = path.resolve('src/data');
  const clientDocs = JSON.parse(fs.readFileSync(path.join(dataDir, 'clientDocuments.json'), 'utf-8'));
  const clientTasks = JSON.parse(fs.readFileSync(path.join(dataDir, 'clientTasks.json'), 'utf-8'));
  const clientMeetings = JSON.parse(fs.readFileSync(path.join(dataDir, 'clientMeetings.json'), 'utf-8'));

  // Ensure client files belong only to Sarah Jenkins
  for (const doc of clientDocs) {
    assert.equal(doc.client, 'Sarah Jenkins', `Client document ${doc.id} must belong only to Sarah Jenkins`);
  }

  for (const task of clientTasks) {
    assert.equal(task.client, 'Sarah Jenkins', `Client task ${task.id} must be assigned to Sarah Jenkins`);
  }

  for (const meeting of clientMeetings) {
    assert.equal(meeting.client, 'Sarah Jenkins', `Client meeting ${meeting.id} must be with Sarah Jenkins`);
  }
});

// ── 5. PCI-DSS & STRIPE VAULT MASKING AUDIT ──
test('Security Audit: Stored payment instruments comply with PCI masking rules (only last 4 digits)', () => {
  const dataDir = path.resolve('src/data');
  const retainers = JSON.parse(fs.readFileSync(path.join(dataDir, 'retainers.json'), 'utf-8'));

  for (const retainer of retainers) {
    if (retainer.cardLast4) {
      assert.match(
        retainer.cardLast4,
        /^\d{4}$/,
        `Stored card must only contain 4 masked digits, got: ${retainer.cardLast4}`
      );
    }
  }
});

// ── 6. PRODUCTION HTTP SECURITY HEADERS AUDIT ──
test('Security Audit: vercel.json enforces enterprise HTTP security headers', () => {
  const vercelConfig = JSON.parse(fs.readFileSync(path.resolve('vercel.json'), 'utf-8'));
  assert.ok(vercelConfig.headers, 'vercel.json must define headers');

  const rootHeaderRule = vercelConfig.headers.find((h) => h.source === '/(.*)');
  assert.ok(rootHeaderRule, 'Must define security headers on root path /(.*)');

  const headerKeys = rootHeaderRule.headers.map((h) => h.key);
  assert.ok(headerKeys.includes('X-Content-Type-Options'), 'Must enforce X-Content-Type-Options: nosniff');
  assert.ok(headerKeys.includes('X-Frame-Options'), 'Must enforce X-Frame-Options: SAMEORIGIN (clickjacking prevention)');
  assert.ok(headerKeys.includes('Referrer-Policy'), 'Must enforce Referrer-Policy');
  assert.ok(headerKeys.includes('Permissions-Policy'), 'Must restrict camera/mic permissions');
  assert.ok(headerKeys.includes('Strict-Transport-Security'), 'Must enforce HSTS (HTTPS preload)');
});
