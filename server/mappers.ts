import { normalizeHomologationConfig } from './homologation-config.js';

// PostgreSQL entrega las columnas date/timestamp como objetos Date; String(Date) daría «Fri Nov 20 …».
export const isoDate = (value: unknown) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '').slice(0, 10);

export const mapCompany = (row: Record<string, unknown>) => ({ id: row.id, razonSocial: row.legal_name, ruc: row.tax_id, nombreComercial: row.trade_name, contacto: row.contact_name, email: row.email, telefono: row.phone, estado: row.status, configuracionHomologacion: normalizeHomologationConfig(row.homologation_config) });
export const mapProcess = (row: Record<string, unknown>) => ({ id: row.id, empresaId: row.company_id, codigo: row.code, nombre: row.name, fechaInicio: isoDate(row.start_date), fechaLimite: isoDate(row.deadline), estado: row.status, ejecutivaId: row.executive_id || undefined });
export const mapProvider = (row: Record<string, unknown>, attributes: Record<string, string> = {}) => ({
 id: row.id, empresaId: row.company_id, procesoId: row.process_id, razonSocial: row.legal_name, ruc: row.tax_id,
 personaContacto: row.contact_name, telefonos: row.phones, email: row.email, direccion: row.address,
 departamento: row.department, distrito: row.district, actividadPrincipal: row.main_activity, estado: row.status,
 estadoEjecutiva: row.executive_status || undefined, estadoSupervisor: row.supervisor_status || undefined,
 calificacion: Number(row.score), fechaRegistro: isoDate(row.registered_at), vigencia: row.valid_until ? isoDate(row.valid_until) : 'N/A',
 flujo: row.current_step ? { paso: Number(row.current_step), estado: row.workflow_status, subestado: row.workflow_substatus, version: Number(row.transition_version || 0) } : undefined,
 ejecutivaAsignadaId: row.assigned_executive_id || undefined, inspectorAsignadoId: row.assigned_inspector_id || undefined,
 atributos: attributes,
});
