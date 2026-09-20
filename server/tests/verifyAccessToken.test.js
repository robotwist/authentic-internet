import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/verifyAccessToken.js';

const SECRET = 'socket-auth-test-secret';

test('dynamic import of jsonwebtoken does not expose named verify', async () => {
  const jwtModule = await import('jsonwebtoken');
  assert.equal(typeof jwtModule.verify, 'undefined');
  assert.equal(typeof jwtModule.default?.verify, 'function');
});

test('calling named verify on the ESM namespace throws (pre-fix socket auth)', async () => {
  const jwtModule = await import('jsonwebtoken');
  const token = jwt.sign({ userId: 'user-1' }, SECRET);
  assert.throws(
    () => jwtModule.verify(token, SECRET),
    { message: /jwtModule\.verify is not a function|is not a function/ }
  );
});

test('verifyAccessToken accepts a valid access token', () => {
  const token = jwt.sign({ userId: 'user-1', username: 'ada' }, SECRET);
  const decoded = verifyAccessToken(token, SECRET);
  assert.equal(decoded.userId, 'user-1');
  assert.equal(decoded.username, 'ada');
});

test('verifyAccessToken rejects a missing token, bad secret, and tampered token', () => {
  assert.throws(() => verifyAccessToken('', SECRET), /Token required/);
  assert.throws(() => verifyAccessToken('tok', undefined), /not configured/);
  const token = jwt.sign({ userId: 'user-1' }, SECRET);
  assert.throws(() => verifyAccessToken(token, 'other-secret'));
});

test('socketService uses verifyAccessToken instead of namespace jwt.verify', () => {
  const sourcePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../services/socketService.js'
  );
  const source = readFileSync(sourcePath, 'utf8');
  assert.match(source, /import \{ verifyAccessToken \} from ['"]\.\.\/utils\/verifyAccessToken\.js['"]/);
  assert.match(source, /verifyAccessToken\(token\)/);
  assert.equal(
    /const jwt = await import\(['"]jsonwebtoken['"]\)/.test(source),
    false
  );
});
