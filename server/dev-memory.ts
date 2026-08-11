import { randomUUID } from 'node:crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { clearSessionCookie, newSession, SESSION_COOKIE, setSessionCookie } from './security.js';
import { canUpdateStatus } from './authorization.js';
import type { SessionUser } from './types.js';

export const memoryRouter = Router();
const companies = [
  { id:'decal',razonSocial:'DECAL S.A.C.',ruc:'20512345678',nombreComercial:'DECAL',contacto:'María López',email:'contacto@decal.com',telefono:'987654321',estado:'Activa' },
  { id:'ufitec',razonSocial:'UFITEC S.A.C.',ruc:'20698765432',nombreComercial:'UFITEC',contacto:'José Ramos',email:'contacto@ufitec.com',telefono:'912345678',estado:'Activa' },
];
const processes = [
  { id:'proc-decal-2026',empresaId:'decal',codigo:'DECAL-2026-001',nombre:'Homologación de proveedores 2026',fechaInicio:'2026-01-15',fechaLimite:'2026-10-30',estado:'En curso',ejecutivaId:'eje-decal' },
  { id:'proc-ufitec-2026',empresaId:'ufitec',codigo:'UFITEC-2026-001',nombre:'Homologación anual 2026',fechaInicio:'2026-02-01',fechaLimite:'2026-11-15',estado:'En curso',ejecutivaId:'eje-ufitec' },
];
const providers = [
  { id:'p-001',empresaId:'decal',procesoId:'proc-decal-2026',razonSocial:'Soluciones A&F SAC',ruc:'20501234567',personaContacto:'Mary Timoteo Mallma',telefonos:'502-5438 anexo 104,9',email:'contabilidad@3nexsac.com',direccion:'Av. Morales Duarez Nro. 1508',departamento:'CALLAO',distrito:'Carmen de La Legua',actividadPrincipal:'Otras actividades de apoyo',estado:'En proceso',estadoEjecutiva:'Formulario respondido',estadoSupervisor:'En coordinación',calificacion:4.8,fechaRegistro:'2025-03-12',vigencia:'2026-03-12' },
  { id:'p-002',empresaId:'decal',procesoId:'proc-decal-2026',razonSocial:'3A Ingenieria y Servicios Generales E.I.R.L.',ruc:'20610564551',personaContacto:'Mily Lopez Leon',telefonos:'932109562',email:'info@3aingenieria.com',direccion:'Calle San Antonio Este 619',departamento:'LIMA',distrito:'Rimac',actividadPrincipal:'Venta al por mayor',estado:'En proceso',estadoEjecutiva:'Formulario enviado',calificacion:3.9,fechaRegistro:'2025-02-04',vigencia:'N/A' },
];
const credentials = [
  ['cli-decal','Cliente DECAL','cliente@decal.com','Cliente123','cliente',['decal']],
  ['eje-decal','Ejecutiva DECAL','ejecutiva@decal.com','Ejecutiva123','ejecutiva',['decal']],
  ['sup-decal','Supervisor DECAL','supervisor@decal.com','Supervisor123','supervisor_empresa',['decal']],
  ['cli-ufitec','Cliente UFITEC','cliente@ufitec.com','Cliente123','cliente',['ufitec']],
  ['eje-ufitec','Ejecutiva UFITEC','ejecutiva@ufitec.com','Ejecutiva123','ejecutiva',['ufitec']],
  ['sup-ufitec','Supervisor UFITEC','supervisor@ufitec.com','Supervisor123','supervisor_empresa',['ufitec']],
  ['supervisor-general','Carlos Supervisor General','supervisor@af.com','super20226ayf','supervisor_general',[]],
] as const;
const users = credentials.map(([id,name,email,password,role,empresaIds])=>({id,name,email,passwordHash:bcrypt.hashSync(password,10),role,empresaIds:[...empresaIds]}));
const sessions = new Map<string,string>();

function currentUser(request:Request){const token=request.cookies?.[SESSION_COOKIE] as string|undefined;const id=token?sessions.get(token):undefined;const found=users.find(user=>user.id===id);if(!found)return null;const {passwordHash:_,...user}=found;return user as SessionUser}
function requireUser(request:Request,response:Response,next:NextFunction){const user=currentUser(request);if(!user)return response.status(401).json({error:'Autenticación requerida.'});response.locals.user=user;next()}
function scoped(user:SessionUser,companyId:string){return user.role==='supervisor_general'||user.empresaIds.includes(companyId)}

memoryRouter.post('/auth/login',async(request,response)=>{const user=users.find(item=>item.email===String(request.body.email||'').trim().toLowerCase());if(!user||!await bcrypt.compare(String(request.body.password||''),user.passwordHash))return response.status(401).json({error:'Correo o contraseña incorrectos.'});const session=newSession();sessions.set(session.token,user.id);setSessionCookie(response,session.token,session.expiresAt);const {passwordHash:_,...safe}=user;response.json({user:safe})});
memoryRouter.get('/auth/session',requireUser,(request,response)=>response.json({user:response.locals.user}));
memoryRouter.post('/auth/logout',(request,response)=>{const token=request.cookies?.[SESSION_COOKIE];if(token)sessions.delete(token);clearSessionCookie(response);response.status(204).end()});
memoryRouter.get('/companies',requireUser,(_request,response)=>{const user=response.locals.user as SessionUser;response.json({companies:companies.filter(item=>scoped(user,item.id))})});
memoryRouter.post('/companies',requireUser,(request,response)=>{const user=response.locals.user as SessionUser;if(user.role!=='supervisor_general')return response.status(403).json({error:'No tienes permiso.'});companies.push(request.body);response.status(201).json({company:request.body})});
memoryRouter.get('/processes',requireUser,(_request,response)=>{const user=response.locals.user as SessionUser;response.json({processes:processes.filter(item=>scoped(user,item.empresaId)||(user.role==='ejecutiva'&&item.ejecutivaId===user.id))})});
memoryRouter.post('/processes',requireUser,(request,response)=>{const user=response.locals.user as SessionUser;if(user.role!=='supervisor_general')return response.status(403).json({error:'No tienes permiso.'});processes.push(request.body);response.status(201).json({process:request.body})});
memoryRouter.get('/providers',requireUser,(request,response)=>{const user=response.locals.user as SessionUser,process=processes.find(item=>item.id===request.query.processId);if(!process||(!scoped(user,process.empresaId)&&process.ejecutivaId!==user.id))return response.status(403).json({error:'Proceso fuera de alcance.'});response.json({providers:providers.filter(item=>item.procesoId===process.id)})});
memoryRouter.post('/providers',requireUser,(request,response)=>{const user=response.locals.user as SessionUser;if(user.role==='cliente')return response.status(403).json({error:'No tienes permiso.'});const provider={...request.body,id:request.body.id||randomUUID(),estado:'En proceso',estadoEjecutiva:'Contactado',calificacion:0,fechaRegistro:new Date().toISOString().slice(0,10),vigencia:'N/A'};providers.unshift(provider);response.status(201).json({provider})});
memoryRouter.patch('/providers/:id/status',requireUser,(request,response)=>{const user=response.locals.user as SessionUser,provider=providers.find(item=>item.id===request.params.id);if(!provider)return response.status(404).json({error:'Proveedor no encontrado.'});if(!canUpdateStatus(user.role,request.body.estado))return response.status(403).json({error:'Estado no permitido para tu rol.'});if(user.role==='ejecutiva')provider.estadoEjecutiva=request.body.estado;else provider.estadoSupervisor=request.body.estado;response.json({provider})});
memoryRouter.post('/users',requireUser,(request,response)=>{const user=response.locals.user as SessionUser;if(user.role!=='supervisor_general')return response.status(403).json({error:'No tienes permiso.'});const created={...request.body,id:request.body.id||randomUUID(),passwordHash:bcrypt.hashSync(request.body.password,10)};users.push(created);const {passwordHash:_,password:__,...safe}=created;response.status(201).json({user:safe})});
