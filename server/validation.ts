import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
export function validateBody(schema: ZodType) {
  return (request: Request, response: Response, next: NextFunction) => {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: 'Datos inválidos.', details: parsed.error.flatten().fieldErrors });
    request.body = parsed.data;
    next();
  };
}
