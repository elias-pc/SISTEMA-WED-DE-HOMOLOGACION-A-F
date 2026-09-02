import { randomUUID } from 'node:crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { clearSessionCookie, newSession, SESSION_COOKIE, setSessionCookie } from './security.js';
import type { SessionUser } from './types.js';
import { availableTransitions, legacyProviderStatus, validateTransition, type WorkflowState, type WorkflowTransitionCode } from './workflow.js';

export const memoryRouter = Router();
const companies = [
  { id:'decal',razonSocial:'DECAL S.A.C.',ruc:'20512345678',nombreComercial:'DECAL',contacto:'María López',email:'contacto@decal.com',telefono:'987654321',estado:'Activa' },
  { id:'ufitec',razonSocial:'UFITEC S.A.C.',ruc:'20698765432',nombreComercial:'UFITEC',contacto:'José Ramos',email:'contacto@ufitec.com',telefono:'912345678',estado:'Activa' },
];
const processes = [
  { id:'proc-decal-2026',empresaId:'decal',codigo:'DECAL-2026-001',nombre:'Homologación de proveedores 2026',fechaInicio:'2026-01-15',fechaLimite:'2026-10-30',estado:'En curso',ejecutivaId:'eje-decal' },
  { id:'proc-ufitec-2026',empresaId:'ufitec',codigo:'UFITEC-2026-001',nombre:'Homologación anual 2026',fechaInicio:'2026-02-01',fechaLimite:'2026-11-15',estado:'En curso',ejecutivaId:'eje-ufitec' },
];
const providers: Array<Record<string, any>> = [
  { id:'p-001',empresaId:'decal',procesoId:'proc-decal-2026',razonSocial:'Soluciones A&F SAC',ruc:'20501234567',personaContacto:'Mary Timoteo Mallma',telefonos:'502-5438 anexo 104,9',email:'contabilidad@3nexsac.com',direccion:'Av. Morales Duarez Nro. 1508',departamento:'CALLAO',distrito:'Carmen de La Legua',actividadPrincipal:'Otras actividades de apoyo',estado:'En proceso',estadoEjecutiva:'Formulario respondido',estadoSupervisor:'En coordinación',calificacion:4.8,fechaRegistro:'2025-03-12',vigencia:'2026-03-12',flujo:{paso:7,estado:'INSCRITO',subestado:'VISITA_EN_COORDINACION',version:0} },
  { id:'p-002',empresaId:'decal',procesoId:'proc-decal-2026',razonSocial:'3A Ingenieria y Servicios Generales E.I.R.L.',ruc:'20610564551',personaContacto:'Mily Lopez Leon',telefonos:'932109562',email:'info@3aingenieria.com',direccion:'Calle San Antonio Este 619',departamento:'LIMA',distrito:'Rimac',actividadPrincipal:'Venta al por mayor',estado:'En proceso',estadoEjecutiva:'Formulario enviado',calificacion:3.9,fechaRegistro:'2025-02-04',vigencia:'N/A',flujo:{paso:5,estado:'INSCRITO',subestado:'FORMULARIO_ENVIADO',version:0} },
];
const workflowHistory = new Map<string,Array<Record<string,unknown>>>();
const credentials = [
  ['cli-decal','Cliente DECAL','cliente@decal.com','Cliente123','cliente',['decal']],
  ['eje-decal','Ejecutiva DECAL','ejecutiva@decal.com','Ejecutiva123','ejecutiva',['decal']],
  ['sup-decal','Supervisor DECAL','supervisor@decal.com','Supervisor123','supervisor_empresa',['decal']],
  ['cli-ufitec','Cliente UFITEC','cliente@ufitec.com','Cliente123','cliente',['ufitec']],
  ['eje-ufitec','Ejecutiva UFITEC','ejecutiva@ufitec.com','Ejecutiva123','ejecutiva',['ufitec']],
  ['sup-ufitec','Supervisor UFITEC','supervisor@ufitec.com','Supervisor123','supervisor_empresa',['ufitec']],
  ['supervisor-general','Carlos Supervisor General','supervisor@af.com','super20226ayf','supervisor_general',[]],
  ['admin-af','Administradora A&F','administradora@af.com','super20226ayf','administradora',[]],
  ['jefe-decal','Jefe de Inspecciones DECAL','jefe.inspecciones@decal.com','Jefe123','jefe_inspecciones',['decal']],
  ['inspector-decal','Inspector DECAL','inspector@decal.com','Inspector123','inspector',['decal']],
] as const;
const users = credentials.map(([id,name,email,password,role,empresaIds])=>({id,name,email,passwordHash:bcrypt.hashSync(password,10),role,empresaIds:[...empresaIds]}));
const sessions = new Map<string,string>();

function currentUser(request:Request){const token=request.cookies?.[SESSION_COOKIE] as string|undefined;const id=token?sessions.get(token):undefined;const found=users.find(user=>user.id===id);if(!found)return null;const {passwordHash:_,...user}=found;return user as SessionUser}
function requireUser(request:Request,response:Response,next:NextFunction){const user=currentUser(request);if(!user)return response.status(401).json({error:'Autenticación requerida.'});response.locals.user=user;next()}
function scoped(user:SessionUser,companyId:string){return user.role==='supervisor_general'||user.role==='administradora'||user.empresaIds.includes(companyId)}

memoryRouter.post('/auth/login',async(request,response)=>{const user=users.find(item=>item.email===String(request.body.email||'').trim().toLowerCase());if(!user||!await bcrypt.compare(String(request.body.password||''),user.passwordHash))return response.status(401).json({error:'Correo o contraseña incorrectos.'});const session=newSession();sessions.set(session.token,user.id);setSessionCookie(response,session.token,session.expiresAt);const {passwordHash:_,...safe}=user;response.json({user:safe})});
memoryRouter.get('/auth/session',requireUser,(request,response)=>response.json({user:response.locals.user}));
memoryRouter.post('/auth/logout',(request,response)=>{const token=request.cookies?.[SESSION_COOKIE];if(token)sessions.delete(token);clearSessionCookie(response);response.status(204).end()});
memoryRouter.get('/companies',requireUser,(_request,response)=>{const user=response.locals.user as SessionUser;response.json({companies:companies.filter(item=>scoped(user,item.id))})});
memoryRouter.post('/companies',requireUser,(request,response)=>{const user=response.locals.user as SessionUser;if(!['supervisor_general','administradora'].includes(user.role))return response.status(403).json({error:'No tienes permiso.'});companies.push(request.body);response.status(201).json({company:request.body})});
memoryRouter.get('/processes',requireUser,(_request,response)=>{const user=response.locals.user as SessionUser;response.json({processes:processes.filter(item=>scoped(user,item.empresaId)||(user.role==='ejecutiva'&&item.ejecutivaId===user.id))})});
memoryRouter.post('/processes',requireUser,(request,response)=>{const user=response.locals.user as SessionUser;if(!['supervisor_general','administradora'].includes(user.role))return response.status(403).json({error:'No tienes permiso.'});processes.push(request.body);response.status(201).json({process:request.body})});
memoryRouter.get('/providers',requireUser,(request,response)=>{const user=response.locals.user as SessionUser,process=processes.find(item=>item.id===request.query.processId);if(!process||(!scoped(user,process.empresaId)&&process.ejecutivaId!==user.id))return response.status(403).json({error:'Proceso fuera de alcance.'});response.json({providers:providers.filter(item=>item.procesoId===process.id).map(item=>({...item,transicionesDisponibles:memoryTransitions(item,user)}))})});
memoryRouter.post('/providers',requireUser,(request,response)=>{const user=response.locals.user as SessionUser;if(!['supervisor_general','administradora'].includes(user.role))return response.status(403).json({error:'No tienes permiso.'});const provider={...request.body,id:request.body.id||randomUUID(),estado:'En proceso',estadoEjecutiva:'Contactado',calificacion:0,fechaRegistro:new Date().toISOString().slice(0,10),vigencia:'N/A',flujo:{paso:2,estado:'PENDIENTE_INSCRIPCION',subestado:'REGISTRADO',version:0}};providers.unshift(provider);response.status(201).json({provider:{...provider,transicionesDisponibles:memoryTransitions(provider,user)}})});
memoryRouter.patch('/providers/:id/status',requireUser,(_request,response)=>response.status(410).json({error:'El cambio libre de estado fue retirado. Utiliza una transición válida del flujo.'}));
memoryRouter.get('/providers/:id/workflow',requireUser,(request,response)=>{const user=response.locals.user as SessionUser,provider=providers.find(item=>item.id===request.params.id);if(!provider)return response.status(404).json({error:'Proveedor no encontrado.'});response.json({provider,transicionesDisponibles:memoryTransitions(provider,user),historial:workflowHistory.get(provider.id)||[]})});
memoryRouter.post('/providers/:id/transitions',requireUser,(request,response)=>{
 const user=response.locals.user as SessionUser,provider=providers.find(item=>item.id===request.params.id);if(!provider)return response.status(404).json({error:'Proveedor no encontrado.'});
 const state=memoryState(provider),code=request.body.transicion as WorkflowTransitionCode,rawData=request.body.datos||{},data=request.body.motivo&&rawData.motivo===undefined?{...rawData,motivo:request.body.motivo}:rawData;
 if(request.body.version!==undefined&&request.body.version!==provider.flujo.version)return response.status(409).json({error:'El flujo fue actualizado por otro usuario. Recarga los datos antes de continuar.'});
 const validation=validateTransition(state,code,user.role,data);if(!validation.ok)return response.status(validation.error.includes('rol')?403:'missingFields' in validation?422:409).json({error:validation.error,camposFaltantes:'missingFields' in validation?validation.missingFields:[]});
 const to=validation.transition.to;workflowHistory.set(provider.id,[{id:randomUUID(),transition_code:code,from_step:state.step,from_status:state.status,from_substatus:state.substatus,to_step:to.step,to_status:to.status,to_substatus:to.substatus,actor_user_id:user.id,actor_role:user.role,reason:request.body.motivo||data.motivo||null,metadata:data,created_at:new Date().toISOString()},...(workflowHistory.get(provider.id)||[])]);
 provider.flujo={paso:to.step,estado:to.status,subestado:to.substatus,version:provider.flujo.version+1};provider.estado=legacyProviderStatus(to);if(code==='ASIGNAR_EJECUTIVA')provider.ejecutivaAsignadaId=data.ejecutivaId;if(code==='ASIGNAR_INSPECTOR'||code==='RETOMAR_VISITA')provider.inspectorAsignadoId=data.inspectorId;if(data.fechaVencimiento)provider.vigencia=data.fechaVencimiento;
 response.json({provider,transicionesDisponibles:memoryTransitions(provider,user)});
});
memoryRouter.post('/users',requireUser,(request,response)=>{const user=response.locals.user as SessionUser;if(!['supervisor_general','administradora'].includes(user.role))return response.status(403).json({error:'No tienes permiso.'});const created={...request.body,id:request.body.id||randomUUID(),passwordHash:bcrypt.hashSync(request.body.password,10)};users.push(created);const {passwordHash:_,password:__,...safe}=created;response.status(201).json({user:safe})});

function memoryState(provider:Record<string,any>):WorkflowState{return {step:provider.flujo.paso,status:provider.flujo.estado,substatus:provider.flujo.subestado}}
function memoryTransitions(provider:Record<string,any>,user:SessionUser){return availableTransitions(memoryState(provider),user.role).map(item=>({codigo:item.code,etiqueta:item.label,datosObligatorios:[...(item.requiredFields||[])]}))}
