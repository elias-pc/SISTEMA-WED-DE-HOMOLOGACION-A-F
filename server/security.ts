import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { config } from './config.js';
export const SESSION_COOKIE = 'af_session';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export function newSession() {
  const token = randomBytes(32).toString('base64url');
  return { id: randomUUID(), token, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + config.sessionTtlHours * 3_600_000) };
}
export function setSessionCookie(response: Response, token: string, expires: Date) {
  response.cookie(SESSION_COOKIE, token, { httpOnly: true, secure: config.isProduction, sameSite: 'strict', path: '/', expires });
}
export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: config.isProduction, sameSite: 'strict', path: '/' });
}
