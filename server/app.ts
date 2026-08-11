import express, { type ErrorRequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { companiesRouter } from './routes/companies.js';
import { processesRouter } from './routes/processes.js';
import { providersRouter } from './routes/providers.js';
import { usersRouter } from './routes/users.js';
import { memoryRouter } from './dev-memory.js';
import { pool } from './db/pool.js';

export const app=express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors((request, callback) => {
 const origin = request.headers.origin;
 const requestOrigin = `${request.protocol}://${request.get('host')}`;
 const allowed = !origin || origin === requestOrigin || config.allowedOrigins.includes(origin);
 callback(null, { origin: allowed, credentials: true });
}));
app.use(express.json({limit:'256kb'}));
app.use(cookieParser());
app.use((request,response,next)=>{
 const requestOrigin=`${request.protocol}://${request.get('host')}`;
 if(['POST','PUT','PATCH','DELETE'].includes(request.method)&&request.headers.origin&&request.headers.origin!==requestOrigin&&!config.allowedOrigins.includes(request.headers.origin))return response.status(403).json({error:'Origen no permitido.'});
 next();
});
app.get('/api/health',async(_request,response)=>{
 if(config.useMemoryDatabase)return response.json({status:'ok',storage:'memory'});
 try{await pool.query('SELECT 1');response.json({status:'ok',storage:'postgresql'})}
 catch(error){console.error('[health] PostgreSQL no disponible',error);response.status(503).json({status:'error',storage:'postgresql',error:'Base de datos no disponible.'})}
});
if(config.useMemoryDatabase){console.warn('[database] DATABASE_URL no configurada; usando almacenamiento temporal en memoria.');app.use('/api',memoryRouter)}
app.use('/api/auth',authRouter);
app.use('/api/companies',companiesRouter);
app.use('/api/processes',processesRouter);
app.use('/api/providers',providersRouter);
app.use('/api/users',usersRouter);
app.use('/api',(_request,response)=>response.status(404).json({error:'Ruta no encontrada.'}));
const errorHandler:ErrorRequestHandler=(error,_request,response,_next)=>{
 console.error(error);
 if((error as {code?:string}).code==='23505')return response.status(409).json({error:'Ya existe un registro con esos datos.'});
 if((error as {code?:string}).code==='23503')return response.status(400).json({error:'El registro relacionado no existe.'});
 response.status(500).json({error:'Ocurrió un error interno.'});
};
app.use(errorHandler);
