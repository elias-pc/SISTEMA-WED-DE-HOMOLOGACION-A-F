import type { AuthUser, DashboardResumen, Empresa, EstadoSeguimiento, ExpedienteProveedor, HistorialFlujo, ImportPreview, ProcesoHomologacion, Proveedor, ReporteOperativo, ReporteProductividad, ResumenCartera, ResultadoAsignacion, TransicionDisponible } from '../types';

export class ApiError extends Error { constructor(message:string,public status:number){super(message)} }
async function request<T>(path:string,options:RequestInit={}):Promise<T>{
 const response=await fetch(`/api${path}`,{...options,credentials:'include',headers:{'Content-Type':'application/json',...options.headers}});
 if(!response.ok){const body=await response.json().catch(()=>({error:'No se pudo completar la solicitud.'}));throw new ApiError(body.error||'No se pudo completar la solicitud.',response.status)}
 return response.status===204?undefined as T:response.json();
}
export const api={
 session:()=>request<{user:AuthUser}>('/auth/session'),
 login:(email:string,password:string)=>request<{user:AuthUser}>('/auth/login',{method:'POST',body:JSON.stringify({email,password})}),
 logout:()=>request<void>('/auth/logout',{method:'POST'}),
 companies:()=>request<{companies:Empresa[]}>('/companies'),
 createCompany:(company:Empresa)=>request<{company:Empresa}>('/companies',{method:'POST',body:JSON.stringify(company)}),
 processes:()=>request<{processes:ProcesoHomologacion[]}>('/processes'),
 createProcess:(process:ProcesoHomologacion)=>request<{process:ProcesoHomologacion}>('/processes',{method:'POST',body:JSON.stringify(process)}),
 providers:(processId:string)=>request<{providers:Proveedor[]}>(`/providers?processId=${encodeURIComponent(processId)}`),
 createProvider:(provider:Proveedor)=>request<{provider:Proveedor}>('/providers',{method:'POST',body:JSON.stringify(provider)}),
  updateProviderStatus:(id:string,estado:EstadoSeguimiento)=>request<{provider:Proveedor}>(`/providers/${encodeURIComponent(id)}/status`,{method:'PATCH',body:JSON.stringify({estado})}),
  providerWorkflow:(id:string)=>request<{provider:Proveedor;transicionesDisponibles:TransicionDisponible[];historial:unknown[]}>(`/providers/${encodeURIComponent(id)}/workflow`),
  applyProviderTransition:(id:string,payload:{transicion:string;datos?:Record<string,unknown>;motivo?:string;version?:number})=>request<{provider:Proveedor;transicionesDisponibles:TransicionDisponible[]}>(`/providers/${encodeURIComponent(id)}/transitions`,{method:'POST',body:JSON.stringify(payload)}),
  providerDossier:(id:string)=>request<ExpedienteProveedor>(`/providers/${encodeURIComponent(id)}/dossier`),
  providerWorkflowDetail:(id:string)=>request<{provider:Proveedor;transicionesDisponibles:TransicionDisponible[];historial:HistorialFlujo[]}>(`/providers/${encodeURIComponent(id)}/workflow`),
  providerDocument:(id:string,payload:{category:string;originalName:string;mimeType:string;contentBase64:string;expiresOn?:string})=>request<{document:ExpedienteProveedor['documents'][number]}>(`/providers/${encodeURIComponent(id)}/documents`,{method:'POST',body:JSON.stringify(payload)}),
  updateContactPreferences:(id:string,payload:{whatsappPhone?:string;whatsappOptIn:boolean;whatsappOptInSource?:string})=>request<{contactPreferences:ExpedienteProveedor['contactPreferences']}>(`/providers/${encodeURIComponent(id)}/contact-preferences`,{method:'PUT',body:JSON.stringify(payload)}),
  previewProviderImport:(payload:{empresaId:string;procesoId:string;fileName:string;contentBase64:string})=>request<ImportPreview>('/providers/import/preview',{method:'POST',body:JSON.stringify(payload)}),
  importProviders:(payload:{empresaId:string;procesoId:string;fileName:string;contentBase64:string})=>request<ImportPreview>('/providers/import',{method:'POST',body:JSON.stringify(payload)}),
  users:(empresaId:string)=>request<{users:AuthUser[]}>(`/users?empresaId=${encodeURIComponent(empresaId)}`),
  dashboardReport:(processId:string)=>request<DashboardResumen>(`/reports/dashboard?processId=${encodeURIComponent(processId)}`),
  operationalReport:(processId:string,type:'directorio'|'facturacion'|'homologados'|'inspecciones'|'trazabilidad')=>request<ReporteOperativo>(`/reports/operational?processId=${encodeURIComponent(processId)}&type=${encodeURIComponent(type)}`),
  productivityReport:(processId:string,from:string,to:string)=>request<ReporteProductividad>(`/reports/productivity?processId=${encodeURIComponent(processId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  portfolio:(processId:string)=>request<ResumenCartera>(`/assignments/portfolio?processId=${encodeURIComponent(processId)}`),
  assignProviders:(payload:{processId:string;providerIds:string[];executiveId:string;reason:string})=>request<ResultadoAsignacion>('/assignments/assign',{method:'POST',body:JSON.stringify(payload)}),
  distributeProviders:(payload:{processId:string;providerIds:string[];mode:'balanced'|'quantity';executiveIds?:string[];quantities?:Array<{executiveId:string;quantity:number}>;reason:string})=>request<ResultadoAsignacion>('/assignments/distribute',{method:'POST',body:JSON.stringify(payload)}),
  unassignProviders:(payload:{processId:string;providerIds:string[];reason:string})=>request<ResultadoAsignacion>('/assignments/unassign',{method:'POST',body:JSON.stringify(payload)}),
  createUser:(user:{id?:string;name:string;email:string;password:string;role:'cliente'|'ejecutiva'|'supervisor_empresa'|'jefe_inspecciones'|'inspector';empresaIds:string[]})=>request<{user:AuthUser}>('/users',{method:'POST',body:JSON.stringify(user)}),
};
