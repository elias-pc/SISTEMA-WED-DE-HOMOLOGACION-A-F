export const mapCompany = (row: Record<string, unknown>) => ({ id: row.id, razonSocial: row.legal_name, ruc: row.tax_id, nombreComercial: row.trade_name, contacto: row.contact_name, email: row.email, telefono: row.phone, estado: row.status });
export const mapProcess = (row: Record<string, unknown>) => ({ id: row.id, empresaId: row.company_id, codigo: row.code, nombre: row.name, fechaInicio: String(row.start_date).slice(0,10), fechaLimite: String(row.deadline).slice(0,10), estado: row.status, ejecutivaId: row.executive_id });
export const mapProvider = (row: Record<string, unknown>) => ({
 id: row.id, empresaId: row.company_id, procesoId: row.process_id, razonSocial: row.legal_name, ruc: row.tax_id,
 personaContacto: row.contact_name, telefonos: row.phones, email: row.email, direccion: row.address,
 departamento: row.department, distrito: row.district, actividadPrincipal: row.main_activity, estado: row.status,
 estadoEjecutiva: row.executive_status || undefined, estadoSupervisor: row.supervisor_status || undefined,
 calificacion: Number(row.score), fechaRegistro: String(row.registered_at).slice(0,10), vigencia: row.valid_until ? String(row.valid_until).slice(0,10) : 'N/A',
});
