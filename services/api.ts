import type { AuthUser, Empresa, EstadoSeguimiento, ProcesoHomologacion, Proveedor } from '../types';

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
  createUser:(user:{id?:string;name:string;email:string;password:string;role:'cliente'|'ejecutiva'|'supervisor_empresa';empresaIds:string[]})=>request<{user:AuthUser}>('/users',{method:'POST',body:JSON.stringify(user)}),
};
