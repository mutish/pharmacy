import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function get(pathname = '/') {
  return new Promise((resolve, reject) => {
    const req = http.get(BASE_URL + pathname, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('error', reject);
  });
}

// Smoke test server responds on root or returns 404 not crashing

test('server responds or 404 at /', async () => {
  const res = await get('/');
  assert.ok([200, 301, 302, 404].includes(res.status), `Unexpected status: ${res.status}`);
});

// Known routes from routes folder should exist, e.g., /api/products

test('products route does not crash', async () => {
  const res = await get('/api/products');
  assert.ok([200, 400, 401, 404].includes(res.status));
});
