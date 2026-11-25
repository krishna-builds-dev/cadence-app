import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('src/data');

const requiredFiles = [
  'clients.json',
  'meetings.json',
  'messages.json',
  'tasks.json',
  'documents.json',
  'retainers.json',
  'prescriptions.json',
  'churnAlerts.json',
  'clientMeetings.json',
  'clientMessages.json',
  'clientTasks.json',
  'clientDocuments.json',
];

test('all essential JSON datasets exist and parse without syntax errors', () => {
  for (const filename of requiredFiles) {
    const filePath = path.join(dataDir, filename);
    assert.ok(fs.existsSync(filePath), `Dataset file ${filename} must exist`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    assert.ok(Array.isArray(parsed), `Dataset ${filename} must be an array`);
    assert.ok(parsed.length > 0, `Dataset ${filename} should contain records`);
  }
});

test('clients dataset has valid structure and schema', () => {
  const clients = JSON.parse(fs.readFileSync(path.join(dataDir, 'clients.json'), 'utf-8'));
  for (const client of clients) {
    assert.ok(client.id, 'Client must have an id');
    assert.ok(client.name, 'Client must have a name');
    assert.ok(client.email, 'Client must have an email');
    assert.ok(client.status, 'Client must have a status');
  }
});

test('documents dataset contains required billing and signing fields', () => {
  const docs = JSON.parse(fs.readFileSync(path.join(dataDir, 'documents.json'), 'utf-8'));
  for (const doc of docs) {
    assert.ok(doc.id, 'Document must have an id');
    assert.ok(doc.name, 'Document must have a title');
    assert.ok(doc.type, 'Document must have a type');
    assert.ok(doc.client, 'Document must have an associated client');
  }
});
