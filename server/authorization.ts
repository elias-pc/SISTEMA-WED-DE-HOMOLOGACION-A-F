import type { UserRole } from './types.js';
export const executiveStatuses=['Contactado','No encontrado','Formulario enviado','Formulario respondido'] as const;
export const supervisorStatuses=['En coordinación','No se ubica','Visita no realizada','Desestimado','Visita realizada'] as const;
export function canUpdateStatus(role:UserRole,status:string){return role==='ejecutiva'?executiveStatuses.includes(status as typeof executiveStatuses[number]):role==='supervisor_empresa'||role==='supervisor_general'?supervisorStatuses.includes(status as typeof supervisorStatuses[number]):false}
export function canAccessCompany(role:UserRole,companyIds:string[],companyId:string){return role==='supervisor_general'||companyIds.includes(companyId)}
