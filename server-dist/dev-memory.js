import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { clearSessionCookie, newSession, SESSION_COOKIE, setSessionCookie } from './security.js';
import { availableTransitions, legacyProviderStatus, validateTransition } from './workflow.js';
import { parseProviderWorkbook } from './provider-import.js';
import { notificationTemplateForTransition } from './notifications.js';
import { readLocalDocument, storeLocalDocument } from './document-storage.js';
import { config } from './config.js';
import { expiryTransition } from './certificate-expiry.js';
import { buildBalancedAssignmentPlan, buildQuantityAssignmentPlan } from './assignment-planning.js';
export const memoryRouter = Router();
const companies = [
    { id: 'decal', razonSocial: 'DECAL S.A.C.', ruc: '20512345678', nombreComercial: 'DECAL', contacto: 'María López', email: 'contacto@decal.com', telefono: '987654321', estado: 'Activa' },
    { id: 'ufitec', razonSocial: 'UFITEC S.A.C.', ruc: '20698765432', nombreComercial: 'UFITEC', contacto: 'José Ramos', email: 'contacto@ufitec.com', telefono: '912345678', estado: 'Activa' },
];
const processes = [
    { id: 'proc-decal-2026', empresaId: 'decal', codigo: 'DECAL-2026-001', nombre: 'Homologación de proveedores 2026', fechaInicio: '2026-01-15', fechaLimite: '2026-10-30', estado: 'En curso', ejecutivaId: 'eje-decal' },
    { id: 'proc-ufitec-2026', empresaId: 'ufitec', codigo: 'UFITEC-2026-001', nombre: 'Homologación anual 2026', fechaInicio: '2026-02-01', fechaLimite: '2026-11-15', estado: 'En curso', ejecutivaId: 'eje-ufitec' },
];
const providers = [
    { id: 'p-001', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Soluciones A&F SAC', ruc: '20501234567', personaContacto: 'Mary Timoteo Mallma', telefonos: '502-5438 anexo 104,9', email: 'contabilidad@3nexsac.com', direccion: 'Av. Morales Duarez Nro. 1508', departamento: 'CALLAO', distrito: 'Carmen de La Legua', actividadPrincipal: 'Otras actividades de apoyo', estado: 'En proceso', estadoEjecutiva: 'Formulario respondido', estadoSupervisor: 'En coordinación', calificacion: 4.8, fechaRegistro: '2025-03-12', vigencia: '2026-03-12', ejecutivaAsignadaId: 'eje-decal', flujo: { paso: 7, estado: 'INSCRITO', subestado: 'VISITA_EN_COORDINACION', version: 0 } },
    { id: 'p-002', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: '3A Ingenieria y Servicios Generales E.I.R.L.', ruc: '20610564551', personaContacto: 'Mily Lopez Leon', telefonos: '932109562', email: 'info@3aingenieria.com', direccion: 'Calle San Antonio Este 619', departamento: 'LIMA', distrito: 'Rimac', actividadPrincipal: 'Venta al por mayor', estado: 'En proceso', estadoEjecutiva: 'Formulario enviado', calificacion: 3.9, fechaRegistro: '2025-02-04', vigencia: 'N/A', ejecutivaAsignadaId: 'eje-decal-2', flujo: { paso: 5, estado: 'INSCRITO', subestado: 'FORMULARIO_ENVIADO', version: 0 } },
];
const workflowHistory = new Map();
const providerDossiers = new Map();
const credentials = [
    ['cli-decal', 'Cliente DECAL', 'cliente@decal.com', 'Cliente123', 'cliente', ['decal']],
    ['eje-decal', 'Ejecutiva DECAL', 'ejecutiva@decal.com', 'Ejecutiva123', 'ejecutiva', ['decal']],
    ['eje-decal-2', 'Ejecutiva DECAL 2', 'ejecutiva2@decal.com', 'Ejecutiva123', 'ejecutiva', ['decal']],
    ['sup-decal', 'Supervisor DECAL', 'supervisor@decal.com', 'Supervisor123', 'supervisor_empresa', ['decal']],
    ['cli-ufitec', 'Cliente UFITEC', 'cliente@ufitec.com', 'Cliente123', 'cliente', ['ufitec']],
    ['eje-ufitec', 'Ejecutiva UFITEC', 'ejecutiva@ufitec.com', 'Ejecutiva123', 'ejecutiva', ['ufitec']],
    ['sup-ufitec', 'Supervisor UFITEC', 'supervisor@ufitec.com', 'Supervisor123', 'supervisor_empresa', ['ufitec']],
    ['supervisor-general', 'Carlos Supervisor General', 'supervisor@af.com', 'super20226ayf', 'supervisor_general', []],
    ['admin-af', 'Administradora A&F', 'administradora@af.com', 'super20226ayf', 'administradora', []],
    ['jefe-decal', 'Jefe de Inspecciones DECAL', 'jefe.inspecciones@decal.com', 'Jefe123', 'jefe_inspecciones', ['decal']],
    ['inspector-decal', 'Inspector DECAL', 'inspector@decal.com', 'Inspector123', 'inspector', ['decal']],
];
const users = credentials.map(([id, name, email, password, role, empresaIds]) => ({ id, name, email, passwordHash: bcrypt.hashSync(password, 10), role, empresaIds: [...empresaIds] }));
const sessions = new Map();
function dossier(providerId) {
    let value = providerDossiers.get(providerId);
    if (!value) {
        value = { assignments: [], payments: [], forms: [], inspections: [], documents: [], certificates: [], contactPreferences: null, notifications: [] };
        providerDossiers.set(providerId, value);
    }
    return value;
}
function memoryRecords(provider, transition, data, actor) {
    const records = dossier(provider.id), now = new Date().toISOString();
    if (transition === 'ASIGNAR_EJECUTIVA') {
        records.assignments.forEach(item => { if (item.assignment_role === 'ejecutiva' && !item.released_at)
            item.released_at = now; });
        records.assignments.unshift({ id: randomUUID(), provider_id: provider.id, assignment_role: 'ejecutiva', assigned_user_id: data.ejecutivaId, assigned_by_user_id: actor.id, assigned_at: now, reason: data.motivo || null });
    }
    if (transition === 'ASIGNAR_INSPECTOR' || transition === 'RETOMAR_VISITA') {
        records.assignments.forEach(item => { if (item.assignment_role === 'inspector' && !item.released_at)
            item.released_at = now; });
        records.assignments.unshift({ id: randomUUID(), provider_id: provider.id, assignment_role: 'inspector', assigned_user_id: data.inspectorId, assigned_by_user_id: actor.id, assigned_at: now, reason: data.motivo || null });
    }
    if (transition === 'REGISTRAR_PAGO')
        records.payments.unshift({ id: randomUUID(), provider_id: provider.id, bank: data.banco, amount: data.monto, modality: data.modalidad, paid_on: data.fechaPago, operation_number: data.numeroOperacion, invoice_number: data.numeroFactura, created_at: now });
    if (transition === 'ENVIAR_FORMULARIO')
        records.forms.unshift({ id: randomUUID(), provider_id: provider.id, form_name: data.formulario, sent_at: now, created_at: now });
    if (transition === 'RECIBIR_FORMULARIO' && records.forms[0])
        Object.assign(records.forms[0], { received_at: now, documents_conform: Boolean(data.documentosConformes) });
    if (transition === 'PROGRAMAR_VISITA')
        records.inspections.unshift({ id: randomUUID(), provider_id: provider.id, modality: data.modalidadVisita, scheduled_at: data.fechaVisita, status: 'PROGRAMADA', created_at: now });
    if (transition === 'REPROGRAMAR_VISITA' && records.inspections[0])
        Object.assign(records.inspections[0], { scheduled_at: data.fechaVisita, status: 'REPROGRAMADA', reason: data.motivo || null, updated_at: now });
    if ((transition === 'MARCAR_NO_UBICADO_VISITA' || transition === 'DESESTIMAR_VISITA') && records.inspections[0])
        Object.assign(records.inspections[0], { status: transition === 'MARCAR_NO_UBICADO_VISITA' ? 'NO_UBICADO' : 'DESESTIMADA', reason: data.motivo || null, updated_at: now });
    if (transition === 'REGISTRAR_VISITA' && records.inspections[0])
        Object.assign(records.inspections[0], { completed_at: data.fechaVisita, status: 'REALIZADA', report_reference: data.informeVisita, updated_at: now });
    if (transition === 'CONFIRMAR_CONFORMIDAD' && records.inspections[0])
        Object.assign(records.inspections[0], { status: 'CONFORME', documents_conform: Boolean(data.documentosConformes), updated_at: now });
    if (transition === 'EMITIR_ENTREGABLE' || transition === 'REGISTRAR_CERTIFICADO_EXISTENTE')
        records.certificates.unshift({ id: randomUUID(), provider_id: provider.id, document_type: data.tipoDocumento, opinion: data.dictamen || 'Conforme', score: data.puntaje || null, issued_on: data.fechaEmision, expires_on: data.fechaVencimiento, scope: data.alcance || 'Certificado existente', modules: data.modulos || [], result_summary: data.resultados || null, created_at: now });
    const template = notificationTemplateForTransition(transition);
    if (template)
        records.notifications.unshift({ id: randomUUID(), channel: 'WHATSAPP', template_code: template, status: 'OMITIDA', failure_reason: 'WhatsApp está preparado pero permanece desactivado.', created_at: now });
}
function currentUser(request) { const token = request.cookies?.[SESSION_COOKIE]; const id = token ? sessions.get(token) : undefined; const found = users.find(user => user.id === id); if (!found)
    return null; const { passwordHash: _, ...user } = found; return user; }
function requireUser(request, response, next) { const user = currentUser(request); if (!user)
    return response.status(401).json({ error: 'Autenticación requerida.' }); response.locals.user = user; next(); }
function scoped(user, companyId) { return user.role === 'supervisor_general' || user.role === 'administradora' || user.empresaIds.includes(companyId); }
function canSeeProvider(user, provider) {
    if (user.role === 'supervisor_general' || user.role === 'administradora')
        return true;
    if (user.role === 'ejecutiva')
        return provider.ejecutivaAsignadaId === user.id;
    if (user.role === 'inspector')
        return provider.inspectorAsignadoId === user.id;
    return scoped(user, provider.empresaId);
}
function elapsedDays(from, to = new Date().toISOString()) {
    const start = new Date(String(from || '')).getTime(), end = new Date(String(to || '')).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end))
        return null;
    return Math.max(0, Math.floor((end - start) / 86_400_000));
}
function assignMemoryPlan(plan, actor, reason) {
    let assigned = 0, reassigned = 0, unchanged = 0;
    const now = new Date().toISOString();
    for (const item of plan) {
        const provider = providers.find(candidate => candidate.id === item.providerId);
        if (!provider)
            continue;
        if (provider.ejecutivaAsignadaId === item.executiveId) {
            unchanged += 1;
            continue;
        }
        const records = dossier(provider.id);
        const active = records.assignments.find(entry => entry.assignment_role === 'ejecutiva' && !entry.released_at);
        if (active) {
            Object.assign(active, { released_at: now, released_by_user_id: actor.id, release_reason: reason });
            reassigned += 1;
        }
        else if (provider.ejecutivaAsignadaId)
            reassigned += 1;
        else
            assigned += 1;
        records.assignments.unshift({ id: randomUUID(), provider_id: provider.id, assignment_role: 'ejecutiva', assigned_user_id: item.executiveId, assigned_by_user_id: actor.id, assigned_at: now, released_at: null, reason });
        provider.ejecutivaAsignadaId = item.executiveId;
        if (provider.flujo?.subestado === 'REGISTRADO') {
            const from = memoryState(provider), to = { step: 3, status: 'PENDIENTE_INSCRIPCION', substatus: 'ASIGNADO_EJECUTIVA' };
            workflowHistory.set(provider.id, [{ id: randomUUID(), transition_code: 'ASIGNAR_EJECUTIVA', from_step: from.step, from_status: from.status, from_substatus: from.substatus, to_step: to.step, to_status: to.status, to_substatus: to.substatus, actor_user_id: actor.id, actor_role: actor.role, reason, metadata: { ejecutivaId: item.executiveId, origen: 'cartera' }, created_at: now }, ...(workflowHistory.get(provider.id) || [])]);
            provider.flujo = { paso: to.step, estado: to.status, subestado: to.substatus, version: provider.flujo.version + 1 };
        }
    }
    return { assigned, reassigned, unchanged, total: plan.length };
}
memoryRouter.post('/auth/login', async (request, response) => { const user = users.find(item => item.email === String(request.body.email || '').trim().toLowerCase()); if (!user || !await bcrypt.compare(String(request.body.password || ''), user.passwordHash))
    return response.status(401).json({ error: 'Correo o contraseña incorrectos.' }); const session = newSession(); sessions.set(session.token, user.id); setSessionCookie(response, session.token, session.expiresAt); const { passwordHash: _, ...safe } = user; response.json({ user: safe }); });
memoryRouter.get('/auth/session', requireUser, (request, response) => response.json({ user: response.locals.user }));
memoryRouter.post('/auth/logout', (request, response) => { const token = request.cookies?.[SESSION_COOKIE]; if (token)
    sessions.delete(token); clearSessionCookie(response); response.status(204).end(); });
memoryRouter.get('/companies', requireUser, (_request, response) => { const user = response.locals.user; response.json({ companies: companies.filter(item => scoped(user, item.id)) }); });
memoryRouter.post('/companies', requireUser, (request, response) => { const user = response.locals.user; if (!['supervisor_general', 'administradora'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); companies.push(request.body); response.status(201).json({ company: request.body }); });
memoryRouter.get('/processes', requireUser, (_request, response) => { const user = response.locals.user; response.json({ processes: processes.filter(item => scoped(user, item.empresaId) || (user.role === 'ejecutiva' && item.ejecutivaId === user.id)) }); });
memoryRouter.post('/processes', requireUser, (request, response) => { const user = response.locals.user; if (!['supervisor_general', 'administradora'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); processes.push(request.body); response.status(201).json({ process: request.body }); });
memoryRouter.get('/providers', requireUser, (request, response) => { const user = response.locals.user, process = processes.find(item => item.id === request.query.processId); if (!process || !scoped(user, process.empresaId))
    return response.status(403).json({ error: 'Proceso fuera de alcance.' }); response.json({ providers: providers.filter(item => item.procesoId === process.id && canSeeProvider(user, item)).map(item => ({ ...item, transicionesDisponibles: memoryTransitions(item, user) })) }); });
memoryRouter.post('/providers', requireUser, (request, response) => { const user = response.locals.user; if (!['supervisor_general', 'administradora'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); const provider = { ...request.body, id: request.body.id || randomUUID(), estado: 'En proceso', estadoEjecutiva: 'Contactado', calificacion: 0, fechaRegistro: new Date().toISOString().slice(0, 10), vigencia: 'N/A', flujo: { paso: 2, estado: 'PENDIENTE_INSCRIPCION', subestado: 'REGISTRADO', version: 0 } }; providers.unshift(provider); response.status(201).json({ provider: { ...provider, transicionesDisponibles: memoryTransitions(provider, user) } }); });
memoryRouter.post('/providers/import/preview', requireUser, (request, response) => { const user = response.locals.user; if (!['supervisor_general', 'administradora'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); try {
    const rows = parseProviderWorkbook(String(request.body.contentBase64 || '')).map(row => row.provider && providers.some(item => item.procesoId === request.body.procesoId && item.ruc === row.provider.ruc) ? { ...row, provider: undefined, errors: [...row.errors, 'El RUC ya existe en este proceso.'] } : row);
    const ready = rows.filter(row => row.provider && !row.errors.length).length;
    response.json({ summary: { totalRows: rows.length, readyRows: ready, rejectedRows: rows.length - ready }, rows: rows.map(({ raw, ...row }) => row) });
}
catch (error) {
    response.status(422).json({ error: error instanceof Error ? error.message : 'No se pudo leer el archivo Excel.' });
} });
memoryRouter.post('/providers/import', requireUser, (request, response) => { const user = response.locals.user; if (!['supervisor_general', 'administradora'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); try {
    const parsed = parseProviderWorkbook(String(request.body.contentBase64 || ''));
    const rows = parsed.map(row => { if (!row.provider || providers.some(item => item.procesoId === request.body.procesoId && item.ruc === row.provider.ruc))
        return row.provider ? { ...row, provider: undefined, errors: [...row.errors, 'El RUC ya existe en este proceso.'] } : row; const item = { id: randomUUID(), empresaId: request.body.empresaId, procesoId: request.body.procesoId, razonSocial: row.provider.razonSocial, ruc: row.provider.ruc, personaContacto: row.provider.personaContacto, telefonos: row.provider.telefonos, email: row.provider.email, direccion: row.provider.direccion, departamento: row.provider.departamento, distrito: row.provider.distrito, actividadPrincipal: row.provider.actividadPrincipal, atributos: row.provider.attributes, estado: 'En proceso', calificacion: 0, fechaRegistro: new Date().toISOString().slice(0, 10), vigencia: 'N/A', flujo: { paso: 2, estado: 'PENDIENTE_INSCRIPCION', subestado: 'REGISTRADO', version: 0 } }; providers.unshift(item); return row; });
    const imported = rows.filter(row => row.provider && !row.errors.length).length;
    response.status(201).json({ batchId: randomUUID(), summary: { totalRows: rows.length, readyRows: imported, rejectedRows: rows.length - imported }, rows: rows.map(({ raw, ...row }) => row) });
}
catch (error) {
    response.status(422).json({ error: error instanceof Error ? error.message : 'No se pudo leer el archivo Excel.' });
} });
memoryRouter.get('/assignments/portfolio', requireUser, (request, response) => {
    const user = response.locals.user;
    if (!['supervisor_general', 'administradora'].includes(user.role))
        return response.status(403).json({ error: 'No tienes permiso.' });
    const process = processes.find(item => item.id === String(request.query.processId || ''));
    if (!process || !scoped(user, process.empresaId))
        return response.status(404).json({ error: 'Proceso no encontrado.' });
    const processProviders = providers.filter(item => item.procesoId === process.id);
    const executives = users.filter(item => item.role === 'ejecutiva' && item.empresaIds.some(id => id === process.empresaId));
    const history = processProviders.flatMap(provider => dossier(provider.id).assignments.filter(item => item.assignment_role === 'ejecutiva').map(item => ({ ...item, provider_name: provider.razonSocial, assigned_user_name: users.find(candidate => candidate.id === item.assigned_user_id)?.name || '', assigned_by_name: users.find(candidate => candidate.id === item.assigned_by_user_id)?.name || '', released_by_name: users.find(candidate => candidate.id === item.released_by_user_id)?.name || '' }))).sort((a, b) => String(b.assigned_at).localeCompare(String(a.assigned_at)));
    response.json({ executives: executives.map(item => ({ id: item.id, name: item.name, email: item.email, activeCount: processProviders.filter(provider => provider.ejecutivaAsignadaId === item.id).length })), unassignedCount: processProviders.filter(item => !item.ejecutivaAsignadaId).length, providers: processProviders.map(item => ({ id: item.id, legal_name: item.razonSocial, tax_id: item.ruc, assigned_executive_id: item.ejecutivaAsignadaId || null, assigned_executive_name: executives.find(executive => executive.id === item.ejecutivaAsignadaId)?.name || null, current_step: item.flujo.paso, workflow_status: item.flujo.estado, workflow_substatus: item.flujo.subestado, updated_at: item.fechaRegistro })), history: history.slice(0, 200) });
});
memoryRouter.post('/assignments/assign', requireUser, (request, response) => {
    const user = response.locals.user;
    if (!['supervisor_general', 'administradora'].includes(user.role))
        return response.status(403).json({ error: 'No tienes permiso.' });
    const process = processes.find(item => item.id === request.body.processId), executive = users.find(item => item.id === request.body.executiveId && item.role === 'ejecutiva');
    const ids = [...new Set(request.body.providerIds || [])];
    if (!process || !executive || !executive.empresaIds.some(id => id === process.empresaId) || ids.some(id => !providers.some(item => item.id === id && item.procesoId === process.id)))
        return response.status(422).json({ error: 'La ejecutiva o los proveedores no son válidos para este proceso.' });
    if (String(request.body.reason || '').trim().length < 3)
        return response.status(422).json({ error: 'Debes registrar el motivo.' });
    response.json(assignMemoryPlan(ids.map(providerId => ({ providerId, executiveId: executive.id })), user, String(request.body.reason)));
});
memoryRouter.post('/assignments/distribute', requireUser, (request, response) => {
    const user = response.locals.user;
    if (!['supervisor_general', 'administradora'].includes(user.role))
        return response.status(403).json({ error: 'No tienes permiso.' });
    const process = processes.find(item => item.id === request.body.processId), ids = [...new Set(request.body.providerIds || [])];
    if (!process || ids.some(id => !providers.some(item => item.id === id && item.procesoId === process.id)))
        return response.status(422).json({ error: 'Los proveedores no son válidos para este proceso.' });
    try {
        const plan = request.body.mode === 'quantity' ? buildQuantityAssignmentPlan(ids, request.body.quantities || []) : buildBalancedAssignmentPlan(ids, request.body.executiveIds || []);
        const executiveIds = [...new Set(plan.map(item => item.executiveId))];
        if (executiveIds.some(id => !users.some(item => item.id === id && item.role === 'ejecutiva' && item.empresaIds.some(companyId => companyId === process.empresaId))))
            return response.status(422).json({ error: 'Una o más ejecutivas no son válidas para esta empresa.' });
        response.json(assignMemoryPlan(plan, user, String(request.body.reason || 'Distribución de cartera.')));
    }
    catch (error) {
        response.status(422).json({ error: error instanceof Error ? error.message : 'No se pudo distribuir la cartera.' });
    }
});
memoryRouter.post('/assignments/unassign', requireUser, (request, response) => {
    const user = response.locals.user;
    if (!['supervisor_general', 'administradora'].includes(user.role))
        return response.status(403).json({ error: 'No tienes permiso.' });
    const process = processes.find(item => item.id === request.body.processId), ids = [...new Set(request.body.providerIds || [])];
    if (!process || ids.some(id => !providers.some(item => item.id === id && item.procesoId === process.id)))
        return response.status(422).json({ error: 'Los proveedores no son válidos para este proceso.' });
    let unassigned = 0;
    const now = new Date().toISOString();
    for (const id of ids) {
        const provider = providers.find(item => item.id === id);
        const active = dossier(id).assignments.find(item => item.assignment_role === 'ejecutiva' && !item.released_at);
        if (active)
            Object.assign(active, { released_at: now, released_by_user_id: user.id, release_reason: String(request.body.reason || 'Retiro de cartera.') });
        if (provider.ejecutivaAsignadaId) {
            provider.ejecutivaAsignadaId = undefined;
            unassigned += 1;
        }
    }
    response.json({ unassigned, unchanged: ids.length - unassigned });
});
memoryRouter.patch('/providers/:id/status', requireUser, (_request, response) => response.status(410).json({ error: 'El cambio libre de estado fue retirado. Utiliza una transición válida del flujo.' }));
memoryRouter.get('/providers/:id/workflow', requireUser, (request, response) => { const user = response.locals.user, provider = providers.find(item => item.id === request.params.id); if (!provider)
    return response.status(404).json({ error: 'Proveedor no encontrado.' }); if (!canSeeProvider(user, provider))
    return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' }); response.json({ provider, transicionesDisponibles: memoryTransitions(provider, user), historial: workflowHistory.get(provider.id) || [] }); });
memoryRouter.get('/providers/:id/dossier', requireUser, (request, response) => { const user = response.locals.user, provider = providers.find(item => item.id === request.params.id); if (!provider)
    return response.status(404).json({ error: 'Proveedor no encontrado.' }); if (!canSeeProvider(user, provider))
    return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' }); response.json(dossier(provider.id)); });
memoryRouter.put('/providers/:id/contact-preferences', requireUser, (request, response) => { const user = response.locals.user, provider = providers.find(item => item.id === request.params.id); if (!provider)
    return response.status(404).json({ error: 'Proveedor no encontrado.' }); if (!['supervisor_general', 'administradora', 'ejecutiva'].includes(user.role) || !canSeeProvider(user, provider))
    return response.status(403).json({ error: 'No tienes permiso.' }); const preferences = { provider_id: provider.id, whatsapp_phone: request.body.whatsappPhone || null, whatsapp_opt_in: Boolean(request.body.whatsappOptIn), whatsapp_opt_in_at: request.body.whatsappOptIn ? new Date().toISOString() : null, whatsapp_opt_in_source: request.body.whatsappOptInSource || null, updated_at: new Date().toISOString() }; dossier(provider.id).contactPreferences = preferences; response.json({ contactPreferences: preferences }); });
memoryRouter.post('/providers/:id/documents', requireUser, async (request, response) => { const user = response.locals.user, provider = providers.find(item => item.id === request.params.id); if (!provider)
    return response.status(404).json({ error: 'Proveedor no encontrado.' }); if (!canSeeProvider(user, provider))
    return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' }); try {
    const saved = await storeLocalDocument(provider.id, String(request.body.originalName || ''), String(request.body.contentBase64 || ''));
    const document = { id: randomUUID(), category: String(request.body.category || ''), original_name: String(request.body.originalName || ''), mime_type: String(request.body.mimeType || 'application/octet-stream'), byte_size: saved.byteSize, storage_driver: saved.storageDriver, storage_key: saved.storageKey, created_at: new Date().toISOString() };
    dossier(provider.id).documents.unshift(document);
    response.status(201).json({ document });
}
catch (error) {
    response.status(422).json({ error: error instanceof Error ? error.message : 'No se pudo registrar el documento.' });
} });
memoryRouter.get('/providers/:id/documents/:documentId/content', requireUser, async (request, response) => { const user = response.locals.user, provider = providers.find(item => item.id === request.params.id); if (provider && !canSeeProvider(user, provider))
    return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' }); const document = provider ? dossier(provider.id).documents.find(item => item.id === request.params.documentId) : null; if (!document)
    return response.status(404).json({ error: 'Documento no encontrado.' }); try {
    response.type(String(document.mime_type)).send(await readLocalDocument(String(document.storage_key)));
}
catch {
    response.status(404).json({ error: 'El archivo local ya no está disponible.' });
} });
memoryRouter.post('/providers/:id/transitions', requireUser, (request, response) => {
    const user = response.locals.user, provider = providers.find(item => item.id === request.params.id);
    if (!provider)
        return response.status(404).json({ error: 'Proveedor no encontrado.' });
    if (!canSeeProvider(user, provider))
        return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' });
    const state = memoryState(provider), code = request.body.transicion, rawData = request.body.datos || {}, data = request.body.motivo && rawData.motivo === undefined ? { ...rawData, motivo: request.body.motivo } : rawData;
    if (request.body.version !== undefined && request.body.version !== provider.flujo.version)
        return response.status(409).json({ error: 'El flujo fue actualizado por otro usuario. Recarga los datos antes de continuar.' });
    const validation = validateTransition(state, code, user.role, data);
    if (!validation.ok)
        return response.status(validation.error.includes('rol') ? 403 : 'missingFields' in validation ? 422 : 409).json({ error: validation.error, camposFaltantes: 'missingFields' in validation ? validation.missingFields : [] });
    const to = validation.transition.to;
    workflowHistory.set(provider.id, [{ id: randomUUID(), transition_code: code, from_step: state.step, from_status: state.status, from_substatus: state.substatus, to_step: to.step, to_status: to.status, to_substatus: to.substatus, actor_user_id: user.id, actor_role: user.role, reason: request.body.motivo || data.motivo || null, metadata: data, created_at: new Date().toISOString() }, ...(workflowHistory.get(provider.id) || [])]);
    provider.flujo = { paso: to.step, estado: to.status, subestado: to.substatus, version: provider.flujo.version + 1 };
    provider.estado = legacyProviderStatus(to);
    if (code === 'ASIGNAR_EJECUTIVA')
        provider.ejecutivaAsignadaId = data.ejecutivaId;
    if (code === 'ASIGNAR_INSPECTOR' || code === 'RETOMAR_VISITA')
        provider.inspectorAsignadoId = data.inspectorId;
    if (data.fechaVencimiento)
        provider.vigencia = data.fechaVencimiento;
    memoryRecords(provider, code, data, user);
    response.json({ provider, transicionesDisponibles: memoryTransitions(provider, user) });
});
memoryRouter.post('/users', requireUser, (request, response) => { const user = response.locals.user; if (!['supervisor_general', 'administradora'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); const created = { ...request.body, id: request.body.id || randomUUID(), passwordHash: bcrypt.hashSync(request.body.password, 10) }; users.push(created); const { passwordHash: _, password: __, ...safe } = created; response.status(201).json({ user: safe }); });
memoryRouter.get('/users', requireUser, (request, response) => { const user = response.locals.user, companyId = String(request.query.empresaId || ''); if (!['supervisor_general', 'administradora', 'jefe_inspecciones'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); if (!companyId)
    return response.status(400).json({ error: 'Debes indicar una empresa.' }); if (!scoped(user, companyId))
    return response.status(403).json({ error: 'Empresa fuera de tu alcance.' }); response.json({ users: users.filter(item => item.empresaIds.some((id) => id === companyId)).map(({ passwordHash, ...safe }) => safe) }); });
memoryRouter.get('/reports/dashboard', requireUser, (request, response) => { const user = response.locals.user, processId = String(request.query.processId || ''), items = providers.filter(item => item.procesoId === processId && canSeeProvider(user, item)), certificates = items.flatMap(item => dossier(item.id).certificates); const today = '2026-09-03', limit = '2026-10-18'; const sub = (name) => items.filter(item => item.flujo?.subestado === name).length; response.json({ total: items.length, homologados: sub('VIGENTE'), inscritos: items.filter(item => item.flujo?.estado === 'INSCRITO').length, pendientes: items.filter(item => item.flujo?.estado === 'PENDIENTE_INSCRIPCION').length, sin_respuesta: ['NO_RESPONDE', 'NO_UBICADO', 'NO_UBICADO_VISITA'].reduce((sum, name) => sum + sub(name), 0), no_participan: sub('NO_PARTICIPA'), datos_incompletos: sub('DATOS_INCOMPLETOS'), desestimados: sub('DESESTIMADO') + sub('VISITA_DESESTIMADA'), no_son_proveedores: sub('NO_ES_PROVEEDOR'), por_vencer: certificates.filter(item => String(item.expires_on) >= today && String(item.expires_on) <= limit).length, vencidos: certificates.filter(item => String(item.expires_on) < today).length }); });
memoryRouter.get('/reports/status', requireUser, (request, response) => {
    const user = response.locals.user, processId = String(request.query.processId || ''), process = processes.find(item => item.id === processId);
    if (!process)
        return response.status(404).json({ error: 'Proceso no encontrado.' });
    if (!scoped(user, process.empresaId))
        return response.status(403).json({ error: 'Proceso fuera de tu alcance.' });
    const rows = providers.filter(item => item.procesoId === processId && canSeeProvider(user, item)).sort((a, b) => String(a.razonSocial).localeCompare(String(b.razonSocial))).map(provider => {
        const records = dossier(provider.id), certificate = records.certificates[0], attributes = provider.atributos || {};
        const daysToExpiry = certificate?.expires_on ? Math.floor((new Date(String(certificate.expires_on)).getTime() - new Date().getTime()) / 86_400_000) : null;
        return { id: provider.id, ruc: provider.ruc, razonSocial: provider.razonSocial, tipoDocumento: String(certificate?.document_type || records.documents[0]?.category || ''), filtro1: String(attributes.filtro_1 || ''), estado: String(provider.flujo?.estado || ''), subestado: String(provider.flujo?.subestado || ''), dictamen: String(certificate?.opinion || ''), puntajeFinalPonderado: certificate?.score === undefined || certificate?.score === null ? null : Number(certificate.score), fechaEmision: certificate?.issued_on || null, fechaVencimiento: certificate?.expires_on || null, diasPorVencer: Number.isFinite(daysToExpiry) ? daysToExpiry : null, entregables: records.documents.map(item => item.original_name).concat(certificate?.document_type ? [String(certificate.document_type)] : []).join(', '), documentosEntregables: records.documents.map(item => ({ id: String(item.id), originalName: String(item.original_name), mimeType: String(item.mime_type), byteSize: Number(item.byte_size || 0) })) };
    });
    response.json({ rows });
});
memoryRouter.get('/reports/operational', requireUser, (request, response) => { const user = response.locals.user, processId = String(request.query.processId || ''), type = String(request.query.type || 'directorio'), items = providers.filter(item => item.procesoId === processId && canSeeProvider(user, item)); const allRecords = items.flatMap(provider => ({ provider, records: dossier(provider.id) })); const reports = { directorio: { columns: ['RUC', 'Razón social', 'Contacto', 'Correo', 'Teléfonos', 'Departamento', 'Distrito', 'Paso', 'Estado', 'Subestado'], rows: items.map(item => [item.ruc, item.razonSocial, item.personaContacto, item.email, item.telefonos, item.departamento, item.distrito, item.flujo?.paso || '', item.flujo?.estado || '', item.flujo?.subestado || '']) }, facturacion: { columns: ['RUC', 'Proveedor', 'Banco', 'Monto', 'Modalidad', 'Fecha de pago', 'Operación', 'Factura'], rows: allRecords.flatMap(({ provider, records }) => records.payments.map(payment => [provider.ruc, provider.razonSocial, payment.bank, payment.amount, payment.modality, payment.paid_on, payment.operation_number, payment.invoice_number])) }, homologados: { columns: ['RUC', 'Proveedor', 'Tipo', 'Dictamen', 'Puntaje', 'Emisión', 'Vencimiento', 'Alcance'], rows: allRecords.flatMap(({ provider, records }) => records.certificates.map(certificate => [provider.ruc, provider.razonSocial, certificate.document_type, certificate.opinion, certificate.score, certificate.issued_on, certificate.expires_on, certificate.scope])) }, inspecciones: { columns: ['RUC', 'Proveedor', 'Modalidad', 'Programada', 'Realizada', 'Estado', 'Motivo', 'Informe'], rows: allRecords.flatMap(({ provider, records }) => records.inspections.map(inspection => [provider.ruc, provider.razonSocial, inspection.modality, inspection.scheduled_at, inspection.completed_at, inspection.status, inspection.reason, inspection.report_reference])) }, trazabilidad: { columns: ['RUC', 'Proveedor', 'Transición', 'Desde', 'Hacia', 'Rol', 'Motivo', 'Fecha'], rows: items.flatMap(item => (workflowHistory.get(item.id) || []).map(history => [item.ruc, item.razonSocial, history.transition_code, `${history.from_step} · ${history.from_substatus}`, `${history.to_step} · ${history.to_substatus}`, history.actor_role, history.reason, history.created_at])) } }; if (!reports[type])
    return response.status(400).json({ error: 'Tipo de reporte no válido.' }); response.json({ type, ...reports[type] }); });
memoryRouter.get('/reports/productivity', requireUser, (request, response) => {
    const user = response.locals.user;
    if (!['supervisor_general', 'administradora'].includes(user.role))
        return response.status(403).json({ error: 'No tienes permiso.' });
    const process = processes.find(item => item.id === String(request.query.processId || ''));
    if (!process)
        return response.status(404).json({ error: 'Proceso no encontrado.' });
    const from = String(request.query.from || '0000-01-01'), to = `${String(request.query.to || '9999-12-31')}T23:59:59.999Z`;
    const executives = users.filter(item => item.role === 'ejecutiva' && item.empresaIds.some(id => id === process.empresaId));
    const rows = executives.map(executive => { const assignedProviders = providers.filter(item => item.procesoId === process.id && item.ejecutivaAsignadaId === executive.id); const assignments = providers.filter(item => item.procesoId === process.id).flatMap(item => dossier(item.id).assignments).filter(item => item.assignment_role === 'ejecutiva' && item.assigned_user_id === executive.id && String(item.assigned_at) >= from && String(item.assigned_at) <= to); const events = providers.filter(item => item.procesoId === process.id).flatMap(item => (workflowHistory.get(item.id) || []).filter(event => String(event.created_at) >= from && String(event.created_at) <= to && dossier(item.id).assignments.some(assignment => assignment.assignment_role === 'ejecutiva' && assignment.assigned_user_id === executive.id && String(assignment.assigned_at) <= String(event.created_at) && (!assignment.released_at || String(event.created_at) < String(assignment.released_at))))); const count = (code) => events.filter(event => event.transition_code === code).length; const durations = {}; for (const provider of providers.filter(item => item.procesoId === process.id)) {
        const history = [...(workflowHistory.get(provider.id) || [])].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
        history.forEach((event, index) => { const next = history[index + 1]; if (!next)
            return; const hours = (new Date(String(next.created_at)).getTime() - new Date(String(event.created_at)).getTime()) / 3_600_000; if (Number.isFinite(hours))
            (durations[`paso_${event.from_step}`] ||= []).push(hours); });
    } return { executiveId: executive.id, executiveName: executive.name, currentPortfolio: assignedProviders.length, assignedInPeriod: assignments.length, contacts: count('INICIAR_COORDINACION'), formsSent: count('ENVIAR_FORMULARIO'), formsReturned: count('RECIBIR_FORMULARIO'), visitsCoordinated: count('PROGRAMAR_VISITA'), homologated: count('EMITIR_ENTREGABLE') + count('REGISTRAR_CERTIFICADO_EXISTENTE'), pending: assignedProviders.filter(item => item.flujo.estado !== 'HOMOLOGADO').length, averageHoursByStep: Object.fromEntries(Object.entries(durations).map(([step, values]) => [step, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 100) / 100])) }; });
    response.json({ from, to: String(request.query.to || ''), rows });
});
memoryRouter.get('/cron/certificates', (request, response) => { if (!config.cronSecret)
    return response.status(503).json({ error: 'CRON_SECRET no está configurado.' }); if (request.get('authorization') !== `Bearer ${config.cronSecret}`)
    return response.status(401).json({ error: 'Cron no autorizado.' }); let porVencer = 0, vencidos = 0; for (const provider of providers) {
    const state = memoryState(provider), transition = expiryTransition(state.substatus, provider.vigencia === 'N/A' ? null : provider.vigencia, new Date());
    if (!transition)
        continue;
    const validation = validateTransition(state, transition, 'sistema', {});
    if (!validation.ok)
        continue;
    const to = validation.transition.to;
    workflowHistory.set(provider.id, [{ id: randomUUID(), transition_code: transition, from_step: state.step, from_status: state.status, from_substatus: state.substatus, to_step: to.step, to_status: to.status, to_substatus: to.substatus, actor_user_id: null, actor_role: 'sistema', reason: 'Actualización automática de vigencia.', metadata: {}, created_at: new Date().toISOString() }, ...(workflowHistory.get(provider.id) || [])]);
    provider.flujo = { paso: to.step, estado: to.status, subestado: to.substatus, version: provider.flujo.version + 1 };
    provider.estado = legacyProviderStatus(to);
    memoryRecords(provider, transition, {}, { id: 'sistema', name: 'Sistema', email: '', role: 'supervisor_general', empresaIds: [] });
    if (transition === 'MARCAR_VENCIDO')
        vencidos += 1;
    else
        porVencer += 1;
} response.json({ ok: true, porVencer, vencidos }); });
function memoryState(provider) { return { step: provider.flujo.paso, status: provider.flujo.estado, substatus: provider.flujo.subestado }; }
function memoryTransitions(provider, user) { return availableTransitions(memoryState(provider), user.role).map(item => ({ codigo: item.code, etiqueta: item.label, datosObligatorios: [...(item.requiredFields || [])] })); }
