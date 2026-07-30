import { describe, expect, test } from '@jest/globals';
import {
  isAllowedProxyHostname,
  validateProxyUrl,
} from '../utils/proxyAllowlist.js';

describe('proxy allowlist', () => {
  test('allows exact allowlisted hostnames', () => {
    expect(isAllowedProxyHostname('zenquotes.io')).toBe(true);
    expect(isAllowedProxyHostname('api.quotable.io')).toBe(true);
    expect(isAllowedProxyHostname('folgerdigitaltexts.org')).toBe(true);
    expect(isAllowedProxyHostname('quotes.rest')).toBe(true);
  });

  test('allows real subdomains of allowlisted domains', () => {
    expect(isAllowedProxyHostname('www.zenquotes.io')).toBe(true);
    expect(isAllowedProxyHostname('cdn.api.quotable.io')).toBe(true);
  });

  test('rejects substring lookalikes that previously bypassed includes()', () => {
    expect(isAllowedProxyHostname('evilzenquotes.io')).toBe(false);
    expect(isAllowedProxyHostname('azenquotes.io')).toBe(false);
    expect(isAllowedProxyHostname('notapi.quotable.io.evil.com')).toBe(false);
    expect(isAllowedProxyHostname('folgerdigitaltexts.org.evil.com')).toBe(false);
    expect(isAllowedProxyHostname('quotes.rest.attacker.example')).toBe(false);
  });

  test('rejects DNS rebinding / local resolution helper domains', () => {
    expect(isAllowedProxyHostname('zenquotes.io.127.0.0.1.nip.io')).toBe(false);
    expect(isAllowedProxyHostname('zenquotes.io.localtest.me')).toBe(false);
    expect(isAllowedProxyHostname('api.quotable.io.sslip.io')).toBe(false);
  });

  test('rejects localhost and private IP hostnames', () => {
    expect(isAllowedProxyHostname('localhost')).toBe(false);
    expect(isAllowedProxyHostname('127.0.0.1')).toBe(false);
    expect(isAllowedProxyHostname('10.0.0.5')).toBe(false);
    expect(isAllowedProxyHostname('192.168.1.1')).toBe(false);
    expect(isAllowedProxyHostname('172.16.0.2')).toBe(false);
    expect(isAllowedProxyHostname('169.254.169.254')).toBe(false);
    expect(isAllowedProxyHostname('::1')).toBe(false);
  });

  test('validateProxyUrl accepts only http(s) allowlisted URLs', () => {
    expect(validateProxyUrl('https://zenquotes.io/api/random').ok).toBe(true);
    expect(validateProxyUrl('http://api.quotable.io/random').ok).toBe(true);

    expect(validateProxyUrl('ftp://zenquotes.io/file').ok).toBe(false);
    expect(validateProxyUrl('https://evilzenquotes.io/steal').ok).toBe(false);
    expect(validateProxyUrl('https://zenquotes.io.127.0.0.1.nip.io/').ok).toBe(false);
    expect(validateProxyUrl('not-a-url').ok).toBe(false);
    expect(validateProxyUrl('').ok).toBe(false);
  });
});
