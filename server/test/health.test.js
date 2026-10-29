import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

test('API root welcomes visitors and links to health without exposing configuration secrets', async () => {
  const response = await request(createApp('memory')).get('/');
  assert.equal(response.status, 200);
  assert.equal(response.body.app, 'ShareBite');
  assert.equal(response.body.version, '1.0.0');
  assert.equal(response.body.databaseMode, 'memory');
  assert.equal(response.body.links.health, '/api/health');
  assert.equal(response.body.mongoUri, undefined);
  assert.equal(response.body.jwtSecret, undefined);
});
test('health returns 503 when the database is disconnected rather than a false success', async () => {
  const response = await request(createApp('persistent')).get('/api/health');
  assert.equal(response.status, 503);
  assert.equal(response.body.status, 'unavailable');
  assert.equal(response.body.databaseConnected, false);
  assert.equal(response.body.databaseMode, 'persistent');
});
