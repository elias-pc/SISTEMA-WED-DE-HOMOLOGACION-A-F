import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticateRequest } from '../middleware/auth.js';
import { clearSessionCookie, hashToken, newSession, SESSION_COOKIE, setSessionCookie } from '../security.js';
import { validateBody } from '../validation.js';
export const authRouter = Router();
const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(8).max(128) });
const loginAttempts = new Map();
function limitLogin(request, response, next) {
    const key = request.ip || 'unknown', now = Date.now(), current = loginAttempts.get(key);
    if (!current || current.resetAt <= now) {
        loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
        return next();
    }
    if (current.count >= 10)
        return response.status(429).json({ error: 'Demasiados intentos. Intenta nuevamente en 15 minutos.' });
    current.count += 1;
    next();
}
authRouter.post('/login', limitLogin, validateBody(loginSchema), async (request, response) => {
    const { email, password } = request.body;
    const result = await pool.query('SELECT id,name,email,password_hash,role FROM users WHERE lower(email)=lower($1) AND active=true', [email]);
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash)))
        return response.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    const companies = await pool.query('SELECT company_id FROM user_companies WHERE user_id=$1', [row.id]);
    const session = newSession();
    await pool.query('INSERT INTO sessions(id,token_hash,user_id,expires_at) VALUES($1,$2,$3,$4)', [session.id, session.tokenHash, row.id, session.expiresAt]);
    setSessionCookie(response, session.token, session.expiresAt);
    loginAttempts.delete(request.ip || 'unknown');
    response.json({ user: { id: row.id, name: row.name, email: row.email, role: row.role, empresaIds: companies.rows.map((item) => item.company_id) } });
});
authRouter.get('/session', authenticateRequest, (request, response) => response.json({ user: request.user }));
authRouter.post('/logout', async (request, response) => {
    const token = request.cookies?.[SESSION_COOKIE];
    if (token)
        await pool.query('DELETE FROM sessions WHERE token_hash=$1', [hashToken(token)]);
    clearSessionCookie(response);
    response.status(204).end();
});
