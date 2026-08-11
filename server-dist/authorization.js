export const executiveStatuses = ['Contactado', 'No encontrado', 'Formulario enviado', 'Formulario respondido'];
export const supervisorStatuses = ['En coordinación', 'No se ubica', 'Visita no realizada', 'Desestimado', 'Visita realizada'];
export function canUpdateStatus(role, status) { return role === 'ejecutiva' ? executiveStatuses.includes(status) : role === 'supervisor_empresa' || role === 'supervisor_general' ? supervisorStatuses.includes(status) : false; }
export function canAccessCompany(role, companyIds, companyId) { return role === 'supervisor_general' || companyIds.includes(companyId); }
