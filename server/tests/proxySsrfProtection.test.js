import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const axiosMock = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: Object.assign(axiosMock, {
    get: jest.fn(),
    post: jest.fn(),
  }),
}));

const { default: proxyRoutes } = await import('../routes/proxy.js');

const app = express();
app.use(express.json());
app.use('/api/proxy', proxyRoutes);

describe('proxy route SSRF protections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axiosMock.mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { ok: true },
    });
  });

  test('blocks substring domain bypass on POST', async () => {
    const res = await request(app)
      .post('/api/proxy')
      .send({ url: 'https://evilzenquotes.io/exfil' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not allowed/i);
    expect(axiosMock).not.toHaveBeenCalled();
  });

  test('blocks nip.io rebinding host on GET', async () => {
    const res = await request(app).get('/api/proxy').query({
      url: 'https://zenquotes.io.127.0.0.1.nip.io/',
    });

    expect(res.status).toBe(403);
    expect(axiosMock).not.toHaveBeenCalled();
  });

  test('rejects non-GET methods even for allowlisted hosts', async () => {
    const res = await request(app)
      .post('/api/proxy')
      .send({
        url: 'https://zenquotes.io/api/random',
        method: 'POST',
        data: { prompt: 'ignore' },
        headers: { Authorization: 'Bearer stolen' },
      });

    expect(res.status).toBe(405);
    expect(axiosMock).not.toHaveBeenCalled();
  });

  test('forwards allowlisted GET without client headers or body', async () => {
    const res = await request(app)
      .post('/api/proxy')
      .send({
        url: 'https://zenquotes.io/api/random',
        method: 'GET',
        headers: { Authorization: 'Bearer stolen', Host: '169.254.169.254' },
        data: { malicious: true },
      });

    expect(res.status).toBe(200);
    expect(axiosMock).toHaveBeenCalledTimes(1);
    const call = axiosMock.mock.calls[0][0];
    expect(call.method).toBe('GET');
    expect(call.url).toBe('https://zenquotes.io/api/random');
    expect(call.headers.Authorization).toBeUndefined();
    expect(call.headers.Host).toBeUndefined();
    expect(call.data).toBeUndefined();
    expect(call.maxRedirects).toBe(0);
  });
});
