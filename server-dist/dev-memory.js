import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { clearSessionCookie, newSession, SESSION_COOKIE, setSessionCookie } from './security.js';
import { availableTransitions, legacyProviderStatus, statusCatalog, transitionDefinition, validateTransition } from './workflow.js';
import { parseProviderWorkbook } from './provider-import.js';
import { notificationTemplateForTransition } from './notifications.js';
import { readLocalDocument, storeLocalDocument } from './document-storage.js';
import { config } from './config.js';
import { expiryTransition } from './certificate-expiry.js';
import { buildBalancedAssignmentPlan, buildQuantityAssignmentPlan } from './assignment-planning.js';
import { buildMyPortfolio } from './my-portfolio.js';
import { automaticExpirationDate, defaultHomologationConfig, normalizeHomologationConfig } from './homologation-config.js';
import { operationalReportColumns, operationalReportTitles } from './operational-reports.js';
import { buildOperationalWorkbook } from './report-workbook.js';
export const memoryRouter = Router();
const companies = [
    { id: 'decal', razonSocial: 'DECAL S.A.C.', ruc: '20512345678', nombreComercial: 'DECAL', contacto: 'María López', email: 'contacto@decal.com', telefono: '987654321', estado: 'Activa', configuracionHomologacion: { ...defaultHomologationConfig, filters: ['Rubro'] } },
    { id: 'ufitec', razonSocial: 'UFITEC S.A.C.', ruc: '20698765432', nombreComercial: 'UFITEC', contacto: 'José Ramos', email: 'contacto@ufitec.com', telefono: '912345678', estado: 'Activa', configuracionHomologacion: { ...defaultHomologationConfig, filters: ['Rubro'] } },
];
const processes = [
    { id: 'proc-decal-2026', empresaId: 'decal', codigo: 'DECAL-2026-001', nombre: 'Homologación de proveedores 2026', fechaInicio: '2026-01-15', fechaLimite: '2026-10-30', estado: 'En curso', ejecutivaId: 'eje-decal' },
    { id: 'proc-ufitec-2026', empresaId: 'ufitec', codigo: 'UFITEC-2026-001', nombre: 'Homologación anual 2026', fechaInicio: '2026-02-01', fechaLimite: '2026-11-15', estado: 'En curso', ejecutivaId: 'eje-ufitec' },
];
const providers = [
    { id: 'p-001', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Soluciones A&F SAC', ruc: '20501234567', personaContacto: 'Mary Timoteo Mallma', telefonos: '502-5438 anexo 104,9', email: 'contabilidad@3nexsac.com', direccion: 'Av. Morales Duarez Nro. 1508', departamento: 'CALLAO', distrito: 'Carmen de La Legua', actividadPrincipal: 'Otras actividades de apoyo', estado: 'En proceso', estadoEjecutiva: 'Formulario respondido', estadoSupervisor: 'En coordinación', calificacion: 4.8, fechaRegistro: '2025-03-12', vigencia: 'N/A', ejecutivaAsignadaId: 'eje-decal', inspectorAsignadoId: 'inspector-decal', atributos: { filtro_1: 'Servicios generales' }, flujo: { paso: 7, estado: 'INSCRITO', subestado: 'VISITA_EN_COORDINACION', version: 0 } },
    { id: 'p-002', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: '3A Ingenieria y Servicios Generales E.I.R.L.', ruc: '20610564551', personaContacto: 'Mily Lopez Leon', telefonos: '932109562', email: 'info@3aingenieria.com', direccion: 'Calle San Antonio Este 619', departamento: 'LIMA', distrito: 'Rimac', actividadPrincipal: 'Venta al por mayor', estado: 'En proceso', estadoEjecutiva: 'Formulario enviado', calificacion: 3.9, fechaRegistro: '2025-02-04', vigencia: 'N/A', ejecutivaAsignadaId: 'eje-decal-2', atributos: { filtro_1: 'Construcción' }, flujo: { paso: 5, estado: 'INSCRITO', subestado: 'FORMULARIO_ENVIADO', version: 0 } },
    { id: 'p-003', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Corporación Andina de Suministros S.A.C.', ruc: '20553456789', personaContacto: 'Rosa Quispe Huamán', telefonos: '987112233', email: 'compras@andinasuministros.com', direccion: 'Av. Nicolás Ayllón 2450', departamento: 'LIMA', distrito: 'Ate', actividadPrincipal: 'Venta al por mayor de materiales', estado: 'En proceso', estadoEjecutiva: 'Contactado', calificacion: 4.2, fechaRegistro: '2026-06-18', vigencia: 'N/A', ejecutivaAsignadaId: 'eje-decal', atributos: { filtro_1: 'Comercialización' }, flujo: { paso: 4, estado: 'PENDIENTE_INSCRIPCION', subestado: 'EN_COORDINACION', version: 0 } },
    { id: 'p-004', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Servicios Generales del Pacífico S.R.L.', ruc: '20601239876', personaContacto: 'Luis Alberto Chávez', telefonos: '956778899', email: 'operaciones@pacificoservicios.com', direccion: 'Jr. Loreto 315', departamento: 'CALLAO', distrito: 'Bellavista', actividadPrincipal: 'Servicios de limpieza y mantenimiento', estado: 'En proceso', estadoEjecutiva: 'Contactado', calificacion: 4.5, fechaRegistro: '2026-08-22', vigencia: 'N/A', ejecutivaAsignadaId: 'eje-decal', atributos: { filtro_1: 'Servicios generales' }, flujo: { paso: 4, estado: 'PENDIENTE_INSCRIPCION', subestado: 'CONFIRMARON_PARTICIPACION', version: 0 } },
    { id: 'p-005', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Distribuidora Lima Norte S.A.C.', ruc: '20547890123', personaContacto: 'Carmen Rojas Paredes', telefonos: '948223344', email: 'ventas@limanorte.com.pe', direccion: 'Av. Alfredo Mendiola 3698', departamento: 'LIMA', distrito: 'Los Olivos', actividadPrincipal: 'Distribución de productos de consumo', estado: 'En proceso', estadoEjecutiva: 'Contactado', calificacion: 3.8, fechaRegistro: '2026-07-05', vigencia: 'N/A', ejecutivaAsignadaId: 'eje-decal', atributos: { filtro_1: 'Comercialización' }, flujo: { paso: 5, estado: 'INSCRITO', subestado: 'PAGO_CONFIRMADO', version: 0 } },
    { id: 'p-006', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Tecnología Industrial Perú S.A.C.', ruc: '20604567812', personaContacto: 'Jorge Medina Salas', telefonos: '911445566', email: 'proyectos@tecnoindustrial.pe', direccion: 'Av. Tomás Marsano 1450', departamento: 'LIMA', distrito: 'Surquillo', actividadPrincipal: 'Instalación de sistemas industriales', estado: 'En proceso', estadoEjecutiva: 'Formulario respondido', calificacion: 4.1, fechaRegistro: '2026-05-14', vigencia: 'N/A', ejecutivaAsignadaId: 'eje-decal-2', atributos: { filtro_1: 'Tecnología' }, flujo: { paso: 6, estado: 'INSCRITO', subestado: 'FORMULARIO_DEVUELTO', version: 0 } },
    { id: 'p-007', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Logística Integral Callao S.A.', ruc: '20517890456', personaContacto: 'Ana Cecilia Torres', telefonos: '997334455', email: 'logistica@integralcallao.com', direccion: 'Av. Elmer Faucett 820', departamento: 'CALLAO', distrito: 'Callao', actividadPrincipal: 'Almacenamiento y transporte de carga', estado: 'En proceso', calificacion: 4.3, fechaRegistro: '2026-04-30', vigencia: 'N/A', ejecutivaAsignadaId: 'eje-decal', inspectorAsignadoId: 'inspector-decal', atributos: { filtro_1: 'Logística' }, flujo: { paso: 7, estado: 'INSCRITO', subestado: 'INSPECTOR_ASIGNADO', version: 0 } },
    { id: 'p-008', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Construcciones y Montajes del Sur E.I.R.L.', ruc: '20487654321', personaContacto: 'Pedro Ccahuana Flores', telefonos: '959887766', email: 'obras@montajessur.com', direccion: 'Av. Independencia 1204', departamento: 'AREQUIPA', distrito: 'Arequipa', actividadPrincipal: 'Construcción de obras civiles', estado: 'En proceso', estadoSupervisor: 'Visita realizada', calificacion: 4.0, fechaRegistro: '2026-03-19', vigencia: 'N/A', ejecutivaAsignadaId: 'eje-decal', inspectorAsignadoId: 'inspector-decal', atributos: { filtro_1: 'Construcción' }, flujo: { paso: 7, estado: 'INSCRITO', subestado: 'VISITA_REALIZADA', version: 0 } },
    { id: 'p-009', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Suministros Médicos Andinos S.A.C.', ruc: '20608901234', personaContacto: 'María Elena Vargas', telefonos: '934556677', email: 'compras@medicosandinos.pe', direccion: 'Av. Javier Prado Este 1250', departamento: 'LIMA', distrito: 'San Isidro', actividadPrincipal: 'Venta de equipos médicos', estado: 'En proceso', estadoEjecutiva: 'Formulario respondido', calificacion: 4.6, fechaRegistro: '2026-02-11', vigencia: 'N/A', ejecutivaAsignadaId: 'eje-decal', inspectorAsignadoId: 'inspector-decal', atributos: { filtro_1: 'Salud' }, flujo: { paso: 8, estado: 'INSCRITO', subestado: 'PENDIENTE_ENTREGABLES', version: 0 } },
    { id: 'p-010', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Seguridad y Vigilancia Corporativa S.A.C.', ruc: '20546781234', personaContacto: 'Carlos Mendoza Ríos', telefonos: '981223344', email: 'contacto@vigilanciacorporativa.pe', direccion: 'Av. Larco 345', departamento: 'LIMA', distrito: 'Miraflores', actividadPrincipal: 'Servicios de seguridad privada', estado: 'Homologado', calificacion: 4.9, fechaRegistro: '2025-09-15', vigencia: '2027-04-15', ejecutivaAsignadaId: 'eje-decal', atributos: { filtro_1: 'Seguridad' }, flujo: { paso: 9, estado: 'HOMOLOGADO', subestado: 'VIGENTE', version: 0 } },
    { id: 'p-011', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Equipos y Repuestos Industriales S.A.C.', ruc: '20512349876', personaContacto: 'Silvia Navarro Ruiz', telefonos: '943778899', email: 'ventas@equiposindustriales.com', direccion: 'Av. Panamericana Norte 2100', departamento: 'LIMA', distrito: 'San Martín de Porres', actividadPrincipal: 'Comercialización de equipos industriales', estado: 'Homologado', calificacion: 4.4, fechaRegistro: '2025-08-02', vigencia: '2026-12-10', ejecutivaAsignadaId: 'eje-decal', atributos: { filtro_1: 'Industrial' }, flujo: { paso: 9, estado: 'HOMOLOGADO', subestado: 'POR_VENCER', version: 0 } },
    { id: 'p-012', empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Redes y Comunicaciones del Perú S.A.C.', ruc: '20599887766', personaContacto: 'Diego Salazar Ponce', telefonos: '966554433', email: 'soporte@redesperu.com.pe', direccion: 'Av. Caminos del Inca 1590', departamento: 'LIMA', distrito: 'Santiago de Surco', actividadPrincipal: 'Instalación de redes de comunicación', estado: 'Vencido', calificacion: 3.7, fechaRegistro: '2025-07-21', vigencia: '2026-09-30', ejecutivaAsignadaId: 'eje-decal', atributos: { filtro_1: 'Tecnología' }, flujo: { paso: 9, estado: 'HOMOLOGADO', subestado: 'VENCIDO', version: 0 } },
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
const demoAssignments = [
    ['p-001', 'ejecutiva', 'eje-decal', '2026-08-01T10:00:00.000Z'], ['p-002', 'ejecutiva', 'eje-decal-2', '2026-09-01T09:30:00.000Z'],
    ['p-003', 'ejecutiva', 'eje-decal', '2026-06-20T11:00:00.000Z'], ['p-004', 'ejecutiva', 'eje-decal', '2026-08-20T08:45:00.000Z'],
    ['p-005', 'ejecutiva', 'eje-decal', '2026-07-08T10:15:00.000Z'], ['p-006', 'ejecutiva', 'eje-decal-2', '2026-05-16T14:00:00.000Z'],
    ['p-007', 'ejecutiva', 'eje-decal', '2026-05-02T09:00:00.000Z'], ['p-008', 'ejecutiva', 'eje-decal', '2026-03-21T10:30:00.000Z'],
    ['p-009', 'ejecutiva', 'eje-decal', '2026-02-13T09:45:00.000Z'], ['p-010', 'ejecutiva', 'eje-decal', '2025-09-17T10:00:00.000Z'],
    ['p-011', 'ejecutiva', 'eje-decal', '2025-08-04T09:20:00.000Z'], ['p-012', 'ejecutiva', 'eje-decal', '2025-07-23T11:10:00.000Z'],
    ['p-007', 'inspector', 'inspector-decal', '2026-09-28T15:00:00.000Z'], ['p-008', 'inspector', 'inspector-decal', '2026-09-15T09:15:00.000Z'],
    ['p-009', 'inspector', 'inspector-decal', '2026-09-10T09:00:00.000Z'], ['p-010', 'inspector', 'inspector-decal', '2025-10-20T10:00:00.000Z'],
    ['p-001', 'inspector', 'inspector-decal', '2026-10-05T09:00:00.000Z'],
];
const demoPayments = [
    ['p-001', { bank: 'BCP', amount: 1200, modality: 'Transferencia', paid_on: '2026-08-07', operation_number: '00451021', invoice_number: 'F001-2301' }],
    ['p-002', { bank: 'Interbank', amount: 1350, modality: 'Transferencia', paid_on: '2026-09-04', operation_number: '00781244', invoice_number: 'F001-2412' }],
    ['p-006', { bank: 'BBVA', amount: 1500, modality: 'Depósito', paid_on: '2026-05-22', operation_number: '00981452', invoice_number: 'F001-2115' }],
    ['p-007', { bank: 'BCP', amount: 1450, modality: 'Transferencia', paid_on: '2026-05-14', operation_number: '00452388', invoice_number: 'F001-2204' }],
    ['p-008', { bank: 'Scotiabank', amount: 1600, modality: 'Transferencia', paid_on: '2026-04-03', operation_number: '00112390', invoice_number: 'F001-2143' }],
    ['p-009', { bank: 'BBVA', amount: 1550, modality: 'Transferencia', paid_on: '2026-02-25', operation_number: '00987701', invoice_number: 'F001-2088' }],
    ['p-010', { bank: 'BCP', amount: 1800, modality: 'Transferencia', paid_on: '2025-10-01', operation_number: '00438812', invoice_number: 'F001-1952' }],
    ['p-011', { bank: 'Interbank', amount: 1700, modality: 'Depósito', paid_on: '2025-08-18', operation_number: '00779021', invoice_number: 'F001-1876' }],
    ['p-012', { bank: 'BCP', amount: 1650, modality: 'Transferencia', paid_on: '2025-08-05', operation_number: '00436210', invoice_number: 'F001-1844' }],
];
const demoForms = [
    ['p-001', { form_name: 'Formulario de homologación de proveedores', sent_at: '2026-08-08T15:00:00.000Z', received_at: '2026-08-14T10:20:00.000Z', documentos_conform: true }],
    ['p-002', { form_name: 'Formulario de homologación de proveedores', sent_at: '2026-09-10T15:00:00.000Z' }],
    ['p-006', { form_name: 'Formulario de homologación de proveedores', sent_at: '2026-09-05T12:00:00.000Z', received_at: '2026-09-12T16:30:00.000Z', documentos_conform: false }],
    ['p-007', { form_name: 'Formulario de homologación de proveedores', sent_at: '2026-05-20T09:00:00.000Z', received_at: '2026-05-28T11:45:00.000Z', documentos_conform: true }],
    ['p-008', { form_name: 'Formulario de homologación de proveedores', sent_at: '2026-03-28T10:00:00.000Z', received_at: '2026-04-05T09:30:00.000Z', documentos_conform: true }],
    ['p-009', { form_name: 'Formulario de homologación de proveedores', sent_at: '2026-08-20T09:00:00.000Z', received_at: '2026-08-27T15:10:00.000Z', documentos_conform: true }],
    ['p-010', { form_name: 'Formulario de homologación de proveedores', sent_at: '2025-09-25T09:00:00.000Z', received_at: '2025-10-02T10:00:00.000Z', documentos_conform: true }],
    ['p-011', { form_name: 'Formulario de homologación de proveedores', sent_at: '2025-08-11T09:00:00.000Z', received_at: '2025-08-19T10:00:00.000Z', documentos_conform: true }],
    ['p-012', { form_name: 'Formulario de homologación de proveedores', sent_at: '2025-07-30T09:00:00.000Z', received_at: '2025-08-07T10:00:00.000Z', documentos_conform: true }],
];
const demoInspections = [
    ['p-001', { modality: 'Presencial', scheduled_at: '2026-11-18T09:00:00.000Z', status: 'PROGRAMADA' }],
    ['p-008', { modality: 'Presencial', scheduled_at: '2026-10-10T10:00:00.000Z', completed_at: '2026-10-10T12:30:00.000Z', status: 'REALIZADA', report_reference: 'Informe de visita - Montajes del Sur.pdf' }],
    ['p-009', { modality: 'Virtual', scheduled_at: '2026-09-20T11:00:00.000Z', completed_at: '2026-09-20T12:15:00.000Z', status: 'REALIZADA', report_reference: 'Informe de visita - Suministros Médicos Andinos.pdf' }],
    ['p-010', { modality: 'Presencial', scheduled_at: '2025-11-05T10:00:00.000Z', completed_at: '2025-11-05T12:00:00.000Z', status: 'REALIZADA', report_reference: 'Informe de visita - Miraflores.pdf' }],
];
const demoCertificates = [
    ['p-010', { document_type: 'Certificado', opinion: 'Apto', score: 94.5, issued_on: '2026-04-20', expires_on: '2027-04-15', scope: 'Servicios de seguridad privada', result_summary: 'Proveedor homologado sin observaciones.', modules: [{ nombre: 'Formalidad y legales', puntaje: 96 }, { nombre: 'Capacidad operativa', puntaje: 92 }, { nombre: 'SSO', puntaje: 90 }, { nombre: 'Calidad', puntaje: 95 }, { nombre: 'Ambiental', puntaje: 93 }, { nombre: 'Responsabilidad social', puntaje: 94 }, { nombre: 'Económica-financiera', puntaje: 88 }] }],
    ['p-011', { document_type: 'Certificado', opinion: 'Apto', score: 88, issued_on: '2025-12-15', expires_on: '2026-12-10', scope: 'Comercialización de equipos industriales', result_summary: 'Proveedor homologado con observaciones menores levantadas.', modules: [{ nombre: 'Formalidad y legales', puntaje: 90 }, { nombre: 'Capacidad operativa', puntaje: 86 }, { nombre: 'Calidad', puntaje: 87 }, { nombre: 'Comerciales', puntaje: 84 }, { nombre: 'Económica-financiera', puntaje: 80 }] }],
    ['p-012', { document_type: 'Constancia', opinion: 'Apto', score: 76, issued_on: '2025-10-05', expires_on: '2026-09-30', scope: 'Instalación de redes de comunicación', result_summary: 'Homologación pendiente de renovación.', modules: [{ nombre: 'Formalidad y legales', puntaje: 80 }, { nombre: 'Capacidad operativa', puntaje: 74 }, { nombre: 'Calidad', puntaje: 70 }, { nombre: 'SSO', puntaje: 78 }] }],
];
const demoDocuments = [
    ['p-001', 'Ficha RUC - Soluciones A&F SAC.pdf'], ['p-001', 'Formulario de homologación firmado.pdf'],
    ['p-002', 'Formulario de homologación - 3A Ingeniería.pdf'],
    ['p-003', 'Ficha RUC - Corporación Andina.pdf'], ['p-003', 'Carta de presentación.pdf'],
    ['p-004', 'Formulario de inscripción.pdf'],
    ['p-005', 'Voucher de pago - BCP.pdf'],
    ['p-006', 'Formulario devuelto - Tecnología Industrial.pdf'], ['p-006', 'Carta de subsanación.pdf'],
    ['p-007', 'Orden de visita - Logística Integral Callao.pdf'],
    ['p-008', 'Informe de visita - Montajes del Sur.pdf'], ['p-008', 'Panel fotográfico.pdf'],
    ['p-009', 'Cotización de equipos médicos.pdf'], ['p-009', 'Ficha RUC - Suministros Médicos Andinos.pdf'],
    ['p-010', 'Certificado de homologación 2026.pdf'], ['p-010', 'Informe de visita - Miraflores.pdf'],
    ['p-011', 'Certificado de homologación 2025.pdf'],
    ['p-012', 'Constancia de homologación 2025.pdf'],
];
const demoHistory = [
    ['p-001', [['ASIGNAR_EJECUTIVA', '2026-08-01T10:00:00.000Z'], ['INICIAR_COORDINACION', '2026-08-06T09:00:00.000Z'], ['REGISTRAR_PAGO', '2026-08-07T11:00:00.000Z'], ['ENVIAR_FORMULARIO', '2026-08-08T15:00:00.000Z'], ['RECIBIR_FORMULARIO', '2026-08-14T10:20:00.000Z'], ['ASIGNAR_INSPECTOR', '2026-10-05T09:00:00.000Z'], ['PROGRAMAR_VISITA', '2026-10-28T09:00:00.000Z']]],
    ['p-002', [['ASIGNAR_EJECUTIVA', '2026-09-01T09:30:00.000Z'], ['INICIAR_COORDINACION', '2026-09-02T10:00:00.000Z'], ['REGISTRAR_PAGO', '2026-09-04T11:30:00.000Z'], ['ENVIAR_FORMULARIO', '2026-09-10T15:00:00.000Z']]],
    ['p-003', [['ASIGNAR_EJECUTIVA', '2026-06-20T11:00:00.000Z'], ['INICIAR_COORDINACION', '2026-06-25T09:00:00.000Z']]],
    ['p-004', [['ASIGNAR_EJECUTIVA', '2026-08-20T08:45:00.000Z'], ['INICIAR_COORDINACION', '2026-08-24T10:00:00.000Z'], ['CONFIRMAR_PARTICIPACION', '2026-09-01T09:30:00.000Z']]],
    ['p-005', [['ASIGNAR_EJECUTIVA', '2026-07-08T10:15:00.000Z'], ['INICIAR_COORDINACION', '2026-07-15T09:00:00.000Z'], ['REGISTRAR_PAGO', '2026-09-18T10:00:00.000Z']]],
    ['p-006', [['ASIGNAR_EJECUTIVA', '2026-05-16T14:00:00.000Z'], ['INICIAR_COORDINACION', '2026-05-20T09:00:00.000Z'], ['REGISTRAR_PAGO', '2026-05-22T10:00:00.000Z'], ['ENVIAR_FORMULARIO', '2026-09-05T12:00:00.000Z'], ['RECIBIR_FORMULARIO', '2026-09-12T16:30:00.000Z']]],
    ['p-007', [['ASIGNAR_EJECUTIVA', '2026-05-02T09:00:00.000Z'], ['INICIAR_COORDINACION', '2026-05-06T09:00:00.000Z'], ['REGISTRAR_PAGO', '2026-05-14T10:00:00.000Z'], ['ENVIAR_FORMULARIO', '2026-05-20T09:00:00.000Z'], ['RECIBIR_FORMULARIO', '2026-05-28T11:45:00.000Z'], ['ASIGNAR_INSPECTOR', '2026-09-28T15:00:00.000Z']]],
    ['p-008', [['ASIGNAR_EJECUTIVA', '2026-03-21T10:30:00.000Z'], ['INICIAR_COORDINACION', '2026-03-25T09:00:00.000Z'], ['REGISTRAR_PAGO', '2026-04-03T10:00:00.000Z'], ['ENVIAR_FORMULARIO', '2026-03-28T10:00:00.000Z'], ['RECIBIR_FORMULARIO', '2026-04-05T09:30:00.000Z'], ['ASIGNAR_INSPECTOR', '2026-09-15T09:15:00.000Z'], ['PROGRAMAR_VISITA', '2026-09-30T08:30:00.000Z'], ['REGISTRAR_VISITA', '2026-10-10T12:30:00.000Z']]],
    ['p-009', [['ASIGNAR_EJECUTIVA', '2026-02-13T09:45:00.000Z'], ['INICIAR_COORDINACION', '2026-02-18T09:00:00.000Z'], ['REGISTRAR_PAGO', '2026-02-25T10:00:00.000Z'], ['ENVIAR_FORMULARIO', '2026-08-20T09:00:00.000Z'], ['RECIBIR_FORMULARIO', '2026-08-27T15:10:00.000Z'], ['ASIGNAR_INSPECTOR', '2026-09-10T09:00:00.000Z'], ['PROGRAMAR_VISITA', '2026-09-15T10:00:00.000Z'], ['REGISTRAR_VISITA', '2026-09-20T12:15:00.000Z'], ['CONFIRMAR_CONFORMIDAD', '2026-09-24T10:00:00.000Z']]],
    ['p-010', [['ASIGNAR_EJECUTIVA', '2025-09-17T10:00:00.000Z'], ['INICIAR_COORDINACION', '2025-09-22T09:00:00.000Z'], ['REGISTRAR_PAGO', '2025-10-01T10:00:00.000Z'], ['ENVIAR_FORMULARIO', '2025-09-25T09:00:00.000Z'], ['RECIBIR_FORMULARIO', '2025-10-02T10:00:00.000Z'], ['ASIGNAR_INSPECTOR', '2025-10-20T10:00:00.000Z'], ['PROGRAMAR_VISITA', '2025-10-28T09:00:00.000Z'], ['REGISTRAR_VISITA', '2025-11-05T12:00:00.000Z'], ['CONFIRMAR_CONFORMIDAD', '2025-11-12T09:00:00.000Z'], ['EMITIR_ENTREGABLE', '2026-04-20T10:00:00.000Z']]],
    ['p-011', [['ASIGNAR_EJECUTIVA', '2025-08-04T09:20:00.000Z'], ['INICIAR_COORDINACION', '2025-08-06T09:00:00.000Z'], ['REGISTRAR_PAGO', '2025-08-18T10:00:00.000Z'], ['ENVIAR_FORMULARIO', '2025-08-11T09:00:00.000Z'], ['RECIBIR_FORMULARIO', '2025-08-19T10:00:00.000Z'], ['ASIGNAR_INSPECTOR', '2025-09-10T09:00:00.000Z'], ['PROGRAMAR_VISITA', '2025-09-18T09:00:00.000Z'], ['REGISTRAR_VISITA', '2025-09-29T12:00:00.000Z'], ['CONFIRMAR_CONFORMIDAD', '2025-10-06T09:00:00.000Z'], ['EMITIR_ENTREGABLE', '2025-12-15T10:00:00.000Z'], ['MARCAR_POR_VENCER', '2026-10-26T03:00:00.000Z']]],
    ['p-012', [['ASIGNAR_EJECUTIVA', '2025-07-23T11:10:00.000Z'], ['INICIAR_COORDINACION', '2025-07-28T09:00:00.000Z'], ['REGISTRAR_PAGO', '2025-08-05T10:00:00.000Z'], ['ENVIAR_FORMULARIO', '2025-07-30T09:00:00.000Z'], ['RECIBIR_FORMULARIO', '2025-08-07T10:00:00.000Z'], ['ASIGNAR_INSPECTOR', '2025-08-20T09:00:00.000Z'], ['PROGRAMAR_VISITA', '2025-08-28T09:00:00.000Z'], ['REGISTRAR_VISITA', '2025-09-08T12:00:00.000Z'], ['CONFIRMAR_CONFORMIDAD', '2025-09-15T09:00:00.000Z'], ['EMITIR_ENTREGABLE', '2025-10-05T10:00:00.000Z'], ['MARCAR_POR_VENCER', '2026-08-26T03:00:00.000Z'], ['MARCAR_VENCIDO', '2026-10-01T03:00:00.000Z']]],
];
function seedDemoDossier() {
    const now = new Date().toISOString();
    for (const [providerId, role, userId, assignedAt] of demoAssignments)
        dossier(providerId).assignments.push({ id: randomUUID(), provider_id: providerId, assignment_role: role, assigned_user_id: userId, assigned_by_user_id: role === 'inspector' ? 'jefe-decal' : 'admin-af', assigned_at: assignedAt, reason: role === 'inspector' ? 'Asignación de inspección.' : 'Carga inicial de cartera.' });
    for (const [providerId, payment] of demoPayments)
        dossier(providerId).payments.push({ id: randomUUID(), provider_id: providerId, ...payment, created_at: `${String(payment.paid_on)}T10:00:00.000Z` });
    for (const [providerId, form] of demoForms)
        dossier(providerId).forms.push({ id: randomUUID(), provider_id: providerId, ...form, created_at: String(form.sent_at) });
    for (const [providerId, inspection] of demoInspections)
        dossier(providerId).inspections.push({ id: randomUUID(), provider_id: providerId, ...inspection, created_at: String(inspection.scheduled_at) });
    for (const [providerId, certificate] of demoCertificates)
        dossier(providerId).certificates.push({ id: randomUUID(), provider_id: providerId, ...certificate, created_at: `${String(certificate.issued_on)}T10:00:00.000Z` });
    for (const [providerId, events] of demoHistory) {
        const provider = providers.find(item => item.id === providerId);
        if (!provider)
            continue;
        let state = { step: 2, status: 'PENDIENTE_INSCRIPCION', substatus: 'REGISTRADO' };
        const entries = [];
        for (const [code, createdAt] of events) {
            const transition = transitionDefinition(code);
            if (!transition)
                continue;
            const isVisit = ['PROGRAMAR_VISITA', 'REPROGRAMAR_VISITA', 'REGISTRAR_VISITA', 'CONFIRMAR_CONFORMIDAD'].includes(code);
            const actorId = code === 'ASIGNAR_EJECUTIVA' ? 'admin-af' : code === 'ASIGNAR_INSPECTOR' ? 'jefe-decal' : isVisit ? String(provider.inspectorAsignadoId || 'inspector-decal') : code.startsWith('MARCAR_') ? 'sistema' : String(provider.ejecutivaAsignadaId);
            const actor = users.find(item => item.id === actorId);
            entries.unshift({ id: randomUUID(), transition_code: code, from_step: state.step, from_status: state.status, from_substatus: state.substatus, to_step: transition.to.step, to_status: transition.to.status, to_substatus: transition.to.substatus, actor_user_id: actorId, actor_role: actor?.role || 'sistema', reason: null, metadata: { origen: 'carga demo' }, created_at: createdAt });
            state = { step: transition.to.step, status: transition.to.status, substatus: transition.to.substatus };
        }
        workflowHistory.set(providerId, entries);
    }
    const writesEnabled = !config.isProduction && process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true';
    const root = path.resolve(process.cwd(), config.documentStoragePath);
    for (const [providerId, fileName] of demoDocuments) {
        const provider = providers.find(item => item.id === providerId);
        if (!provider)
            continue;
        const storageKey = `demo/${providerId}/${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const content = demoPdf(fileName.replace(/\.pdf$/, ''), [`Proveedor: ${provider.razonSocial}`, `RUC: ${provider.ruc}`, 'Documento de demostración del expediente de homologación AYF.']);
        dossier(providerId).documents.push({ id: randomUUID(), category: 'Expediente', original_name: fileName, mime_type: 'application/pdf', byte_size: content.length, storage_driver: 'local', storage_key: storageKey, created_at: now });
        if (writesEnabled)
            void mkdir(path.dirname(path.resolve(root, storageKey)), { recursive: true }).then(() => writeFile(path.resolve(root, storageKey), content)).catch(() => undefined);
    }
}
function demoPdf(title, lines) {
    const clean = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, ' ');
    const escape = (value) => clean(value).replace(/([\\()])/g, '\\$1');
    const content = `BT /F1 16 Tf 60 780 Td (${escape(title)}) Tj ET\nBT /F1 11 Tf 60 748 Td 16 TL ${lines.map(line => `(${escape(line)}) Tj T*`).join(' ')} ET`;
    const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`];
    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objects.forEach((body, index) => { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${index + 1} 0 obj\n${body}\nendobj\n`; });
    const xref = Buffer.byteLength(pdf, 'latin1');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return Buffer.from(pdf, 'latin1');
}
if (config.useMemoryDatabase)
    seedDemoDossier();
function memoryRecords(provider, transition, data, actor) {
    const records = dossier(provider.id), now = new Date().toISOString();
    if (transition === 'ASIGNAR_EJECUTIVA' && !records.assignments.some(item => item.assignment_role === 'ejecutiva' && item.assigned_user_id === data.ejecutivaId && !item.released_at)) {
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
        return activeExecutiveIds(provider).includes(user.id);
    if (user.role === 'inspector')
        return provider.inspectorAsignadoId === user.id;
    return scoped(user, provider.empresaId);
}
function activeExecutiveIds(provider) {
    const ids = Array.isArray(provider.ejecutivaAsignadaIds) ? provider.ejecutivaAsignadaIds : [];
    return [...new Set([...ids, ...(provider.ejecutivaAsignadaId ? [provider.ejecutivaAsignadaId] : [])])];
}
function setActiveExecutiveIds(provider, ids) {
    const unique = [...new Set(ids)];
    provider.ejecutivaAsignadaIds = unique;
    provider.ejecutivaAsignadaId = unique[0];
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
        if (activeExecutiveIds(provider).includes(item.executiveId)) {
            unchanged += 1;
            continue;
        }
        const records = dossier(provider.id);
        assigned += 1;
        records.assignments.unshift({ id: randomUUID(), provider_id: provider.id, assignment_role: 'ejecutiva', assigned_user_id: item.executiveId, assigned_by_user_id: actor.id, assigned_at: now, released_at: null, reason });
        setActiveExecutiveIds(provider, [...activeExecutiveIds(provider), item.executiveId]);
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
    return response.status(403).json({ error: 'No tienes permiso.' }); const company = { ...request.body, configuracionHomologacion: normalizeHomologationConfig(request.body.configuracionHomologacion) }; companies.push(company); response.status(201).json({ company }); });
memoryRouter.get('/processes', requireUser, (_request, response) => { const user = response.locals.user; response.json({ processes: processes.filter(item => scoped(user, item.empresaId) || (user.role === 'ejecutiva' && providers.some(provider => provider.procesoId === item.id && activeExecutiveIds(provider).includes(user.id)))) }); });
memoryRouter.post('/processes', requireUser, (request, response) => { const user = response.locals.user; if (!['supervisor_general', 'administradora'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); processes.push(request.body); response.status(201).json({ process: request.body }); });
memoryRouter.get('/providers', requireUser, (request, response) => { const user = response.locals.user, process = processes.find(item => item.id === request.query.processId); if (!process || !scoped(user, process.empresaId))
    return response.status(403).json({ error: 'Proceso fuera de alcance.' }); response.json({ providers: providers.filter(item => item.procesoId === process.id && canSeeProvider(user, item)).map(item => ({ ...item, transicionesDisponibles: memoryTransitions(item, user) })) }); });
memoryRouter.get('/providers/my-portfolio', requireUser, (request, response) => {
    const user = response.locals.user;
    if (user.role !== 'ejecutiva')
        return response.status(403).json({ error: 'No tienes permiso.' });
    const process = processes.find(item => item.id === String(request.query.processId || ''));
    if (!process || !scoped(user, process.empresaId))
        return response.status(403).json({ error: 'Proceso fuera de alcance.' });
    const entries = providers.filter(item => item.procesoId === process.id && activeExecutiveIds(item).includes(user.id)).map((provider) => {
        const assignment = dossier(provider.id).assignments.find((item) => item.assignment_role === 'ejecutiva' && item.assigned_user_id === user.id && !item.released_at);
        return { id: provider.id, legalName: provider.razonSocial, taxId: provider.ruc, currentStep: provider.flujo.paso, workflowStatus: provider.flujo.estado, workflowSubstatus: provider.flujo.subestado, assignedAt: assignment?.assigned_at || provider.fechaRegistro, validUntil: provider.vigencia === 'N/A' ? null : provider.vigencia };
    });
    response.json(buildMyPortfolio(entries));
});
memoryRouter.post('/providers', requireUser, (request, response) => { const user = response.locals.user; if (!['supervisor_general', 'administradora'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); const provider = { ...request.body, id: request.body.id || randomUUID(), estado: 'En proceso', estadoEjecutiva: 'Contactado', calificacion: 0, fechaRegistro: new Date().toISOString().slice(0, 10), vigencia: 'N/A', flujo: { paso: 2, estado: 'PENDIENTE_INSCRIPCION', subestado: 'REGISTRADO', version: 0 } }; providers.unshift(provider); response.status(201).json({ provider: { ...provider, transicionesDisponibles: memoryTransitions(provider, user) } }); });
memoryRouter.post('/providers/import/preview', requireUser, (request, response) => { const user = response.locals.user; if (!['supervisor_general', 'administradora'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); try {
    const company = companies.find(item => item.id === request.body.empresaId);
    const rows = parseProviderWorkbook(String(request.body.contentBase64 || ''), company?.configuracionHomologacion.filters || []).map(row => row.provider && providers.some(item => item.procesoId === request.body.procesoId && item.ruc === row.provider.ruc) ? { ...row, provider: undefined, errors: [...row.errors, 'El RUC ya existe en este proceso.'] } : row);
    const ready = rows.filter(row => row.provider && !row.errors.length).length;
    response.json({ summary: { totalRows: rows.length, readyRows: ready, rejectedRows: rows.length - ready }, rows: rows.map(({ raw, ...row }) => row) });
}
catch (error) {
    response.status(422).json({ error: error instanceof Error ? error.message : 'No se pudo leer el archivo Excel.' });
} });
memoryRouter.post('/providers/import', requireUser, (request, response) => { const user = response.locals.user; if (!['supervisor_general', 'administradora'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); try {
    const company = companies.find(item => item.id === request.body.empresaId);
    const parsed = parseProviderWorkbook(String(request.body.contentBase64 || ''), company?.configuracionHomologacion.filters || []);
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
    response.json({ executives: executives.map(item => ({ id: item.id, name: item.name, email: item.email, activeCount: processProviders.filter(provider => activeExecutiveIds(provider).includes(item.id)).length })), unassignedCount: processProviders.filter(item => activeExecutiveIds(item).length === 0).length, providers: processProviders.map(item => ({ id: item.id, legal_name: item.razonSocial, tax_id: item.ruc, assignedExecutives: activeExecutiveIds(item).map(id => ({ id, name: executives.find(executive => executive.id === id)?.name || id })), current_step: item.flujo.paso, workflow_status: item.flujo.estado, workflow_substatus: item.flujo.subestado, updated_at: item.fechaRegistro })), history: history.slice(0, 200) });
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
    const process = processes.find(item => item.id === request.body.processId), ids = [...new Set(request.body.providerIds || [])], executiveId = String(request.body.executiveId || '');
    if (!process || !executiveId || ids.some(id => !providers.some(item => item.id === id && item.procesoId === process.id)))
        return response.status(422).json({ error: 'Los proveedores o la ejecutiva no son válidos para este proceso.' });
    let unassigned = 0;
    const now = new Date().toISOString();
    for (const id of ids) {
        const provider = providers.find(item => item.id === id);
        const active = dossier(id).assignments.find(item => item.assignment_role === 'ejecutiva' && item.assigned_user_id === executiveId && !item.released_at);
        if (active)
            Object.assign(active, { released_at: now, released_by_user_id: user.id, release_reason: String(request.body.reason || 'Retiro de cartera.') });
        const idsAfter = activeExecutiveIds(provider).filter(item => item !== executiveId);
        if (idsAfter.length !== activeExecutiveIds(provider).length) {
            setActiveExecutiveIds(provider, idsAfter);
            unassigned += 1;
        }
    }
    response.json({ unassigned, unchanged: ids.length - unassigned });
});
memoryRouter.patch('/providers/:id/status', requireUser, (_request, response) => response.status(410).json({ error: 'El cambio libre de estado fue retirado. Utiliza una transición válida del flujo.' }));
memoryRouter.get('/providers/:id/workflow', requireUser, (request, response) => { const user = response.locals.user, provider = providers.find(item => item.id === request.params.id); if (!provider)
    return response.status(404).json({ error: 'Proveedor no encontrado.' }); if (!canSeeProvider(user, provider))
    return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' }); response.json({ provider, transicionesDisponibles: memoryTransitions(provider, user), catalogoEstados: statusCatalog, historial: workflowHistory.get(provider.id) || [] }); });
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
    if (code === 'EMITIR_ENTREGABLE' || code === 'REGISTRAR_CERTIFICADO_EXISTENTE') {
        const company = companies.find(item => item.id === provider.empresaId);
        const config = normalizeHomologationConfig(company?.configuracionHomologacion);
        const documentType = config.documentTypes.find(item => item.name === String(data.tipoDocumento || ''));
        if (!documentType)
            return response.status(422).json({ error: 'Selecciona un tipo de documento configurado para esta empresa.' });
        const expiration = automaticExpirationDate(data.fechaEmision, documentType.validityDays);
        if (expiration)
            data.fechaVencimiento = expiration;
        if (Array.isArray(data.modulos))
            data.modulos = data.modulos.filter((item) => item && typeof item === 'object' && config.evaluationModules.includes(String(item.nombre || '')));
    }
    const validation = validateTransition(state, code, user.role, data);
    if (!validation.ok)
        return response.status(validation.error.includes('rol') ? 403 : 'missingFields' in validation ? 422 : 409).json({ error: validation.error, camposFaltantes: 'missingFields' in validation ? validation.missingFields : [] });
    const to = validation.transition.to;
    workflowHistory.set(provider.id, [{ id: randomUUID(), transition_code: code, from_step: state.step, from_status: state.status, from_substatus: state.substatus, to_step: to.step, to_status: to.status, to_substatus: to.substatus, actor_user_id: user.id, actor_role: user.role, reason: request.body.motivo || data.motivo || null, metadata: data, created_at: new Date().toISOString() }, ...(workflowHistory.get(provider.id) || [])]);
    provider.flujo = { paso: to.step, estado: to.status, subestado: to.substatus, version: provider.flujo.version + 1 };
    provider.estado = legacyProviderStatus(to);
    if (code === 'ASIGNAR_EJECUTIVA')
        setActiveExecutiveIds(provider, [...activeExecutiveIds(provider), data.ejecutivaId]);
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
memoryRouter.get('/users/executives', requireUser, (request, response) => { const user = response.locals.user; if (!['supervisor_general', 'administradora'].includes(user.role))
    return response.status(403).json({ error: 'No tienes permiso.' }); response.json({ users: users.filter(item => item.role === 'ejecutiva' && item.active !== false).map(({ passwordHash, ...safe }) => safe) }); });
memoryRouter.patch('/users/:userId/companies', requireUser, (request, response) => {
    const actor = response.locals.user;
    if (!['supervisor_general', 'administradora'].includes(actor.role))
        return response.status(403).json({ error: 'No tienes permiso.' });
    const target = users.find(item => item.id === String(request.params.userId) && item.role === 'ejecutiva' && item.active !== false), empresaIds = request.body?.empresaIds;
    if (!target)
        return response.status(404).json({ error: 'No se encontró una ejecutiva activa.' });
    if (!Array.isArray(empresaIds) || !empresaIds.length || empresaIds.some((id) => typeof id !== 'string' || !companies.some(company => company.id === id)) || new Set(empresaIds).size !== empresaIds.length)
        return response.status(422).json({ error: 'Selecciona una o más empresas válidas, sin repetir.' });
    const removed = target.empresaIds.filter((id) => !empresaIds.includes(id));
    const activeAssigned = providers.filter(provider => removed.includes(provider.empresaId) && activeExecutiveIds(provider).includes(target.id)).length;
    if (activeAssigned)
        return response.status(409).json({ error: `No se puede quitar esa empresa: la ejecutiva conserva ${activeAssigned} proveedor(es) asignado(s). Reasígnalos o retíralos primero.` });
    target.empresaIds = [...empresaIds];
    const { passwordHash: _, ...safe } = target;
    response.json({ user: safe });
});
memoryRouter.get('/reports/dashboard', requireUser, (request, response) => { const user = response.locals.user, processId = String(request.query.processId || ''), items = providers.filter(item => item.procesoId === processId && canSeeProvider(user, item)), certificates = items.flatMap(item => dossier(item.id).certificates); const today = new Date().toISOString().slice(0, 10), limit = new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10); const sub = (name) => items.filter(item => item.flujo?.subestado === name).length; response.json({ total: items.length, homologados: sub('VIGENTE'), inscritos: items.filter(item => item.flujo?.estado === 'INSCRITO').length, pendientes: items.filter(item => item.flujo?.estado === 'PENDIENTE_INSCRIPCION').length, sin_respuesta: ['NO_RESPONDE', 'NO_UBICADO', 'NO_UBICADO_VISITA'].reduce((sum, name) => sum + sub(name), 0), no_participan: sub('NO_PARTICIPA'), datos_incompletos: sub('DATOS_INCOMPLETOS'), desestimados: sub('DESESTIMADO') + sub('VISITA_DESESTIMADA'), no_son_proveedores: sub('NO_ES_PROVEEDOR'), por_vencer: certificates.filter(item => String(item.expires_on) >= today && String(item.expires_on) <= limit).length, vencidos: certificates.filter(item => String(item.expires_on) < today).length }); });
memoryRouter.get('/reports/status', requireUser, (request, response) => {
    const user = response.locals.user, processId = String(request.query.processId || ''), process = processes.find(item => item.id === processId);
    if (!process)
        return response.status(404).json({ error: 'Proceso no encontrado.' });
    if (!scoped(user, process.empresaId))
        return response.status(403).json({ error: 'Proceso fuera de tu alcance.' });
    const rows = providers.filter(item => item.procesoId === processId && canSeeProvider(user, item)).sort((a, b) => String(a.razonSocial).localeCompare(String(b.razonSocial))).map(provider => {
        const records = dossier(provider.id), certificate = records.certificates[0], attributes = provider.atributos || {};
        const daysToExpiry = certificate?.expires_on ? Math.floor((new Date(String(certificate.expires_on)).getTime() - new Date().getTime()) / 86_400_000) : null;
        const modules = Array.isArray(certificate?.modules) ? certificate.modules.map((item) => typeof item === 'object' && item ? String(item.nombre || item.name || '') : String(item)).filter(Boolean).join(', ') : '';
        return { id: provider.id, ruc: provider.ruc, razonSocial: provider.razonSocial, tipoDocumento: String(certificate?.document_type || ''), filtro1: String(attributes.filtro_1 || ''), filtro2: String(attributes.filtro_2 || ''), estado: String(provider.flujo?.estado || ''), subestado: String(provider.flujo?.subestado || ''), dictamen: String(certificate?.opinion || ''), puntajeFinalPonderado: certificate?.score === undefined || certificate?.score === null ? null : Number(certificate.score), fechaEmision: certificate?.issued_on || null, fechaVencimiento: certificate?.expires_on || null, diasPorVencer: Number.isFinite(daysToExpiry) ? daysToExpiry : null, entregables: records.documents.map(item => item.original_name).concat(certificate?.document_type ? [String(certificate.document_type)] : []).join(', '), modulos: modules, documentosEntregables: records.documents.map(item => ({ id: String(item.id), originalName: String(item.original_name), mimeType: String(item.mime_type), byteSize: Number(item.byte_size || 0) })) };
    });
    response.json({ rows });
});
const reportDayDiff = (from, to) => { if (!from || !to)
    return null; const start = new Date(`${String(from).slice(0, 10)}T00:00:00Z`).getTime(), end = new Date(`${String(to).slice(0, 10)}T00:00:00Z`).getTime(); return Number.isFinite(start) && Number.isFinite(end) ? Math.round((end - start) / 86_400_000) : null; };
const reportDate = (value) => value ? String(value).slice(0, 10) : null;
function reportUserIds(provider) { const ids = new Set(); if (provider.ejecutivaAsignadaId)
    ids.add(String(provider.ejecutivaAsignadaId)); for (const assignment of dossier(provider.id).assignments)
    if (!assignment.released_at)
        ids.add(String(assignment.assigned_user_id)); return ids; }
function reportExecutiveName(provider) { const assignment = [...dossier(provider.id).assignments].filter(item => item.assignment_role === 'ejecutiva').sort((a, b) => String(b.assigned_at).localeCompare(String(a.assigned_at)))[0]; return users.find(item => item.id === (assignment?.assigned_user_id || provider.ejecutivaAsignadaId))?.name || ''; }
function reportCompanyName(provider) { const company = companies.find(item => item.id === provider.empresaId); return String(company?.nombreComercial || company?.razonSocial || ''); }
function buildMemoryOperationalReport(type, processId, user, userId) {
    const items = providers.filter(item => item.procesoId === processId && canSeeProvider(user, item) && (!userId || reportUserIds(item).has(userId)));
    const rawRows = type === 'directorio' ? items.sort((a, b) => String(a.razonSocial).localeCompare(String(b.razonSocial))).map(provider => ({ razonSocial: provider.razonSocial, contacto: provider.personaContacto, correo: provider.email, telefonos: provider.telefonos, departamento: provider.departamento, distrito: provider.distrito, status: provider.flujo?.estado || '', subStatus: provider.flujo?.subestado || '' }))
        : type === 'facturacion' ? items.flatMap(provider => dossier(provider.id).payments.map(payment => { const form = [...dossier(provider.id).forms].sort((a, b) => String(b.sent_at).localeCompare(String(a.sent_at)))[0]; const sent = reportDate(form?.sent_at); return { usuario: reportExecutiveName(provider), ruc: provider.ruc, cliente: reportCompanyName(provider), razonSocialProveedor: provider.razonSocial, importe: Number(payment.amount), fechaPago: payment.paid_on, nroOperacion: payment.operation_number, nroFactura: payment.invoice_number, fechaEnvioFormulario: sent, dias: reportDayDiff(sent, payment.paid_on) }; })).sort((a, b) => String(b.fechaPago).localeCompare(String(a.fechaPago)))
            : type === 'homologados' ? items.flatMap(provider => dossier(provider.id).certificates.map(certificate => ({ ejecutivaCuenta: reportExecutiveName(provider), cliente: reportCompanyName(provider), ruc: provider.ruc, razonSocialProveedor: provider.razonSocial, subStatus: provider.flujo?.subestado || '', tipoDocumento: certificate.document_type, dictamen: certificate.opinion, puntaje: certificate.score, fechaEmision: certificate.issued_on, fechaVencimiento: certificate.expires_on, diasPorVencer: reportDayDiff(new Date().toISOString(), certificate.expires_on) }))).sort((a, b) => String(a.fechaVencimiento).localeCompare(String(b.fechaVencimiento)))
                : type === 'inspecciones' ? items.flatMap(provider => dossier(provider.id).inspections.map(inspection => { const assignment = [...dossier(provider.id).assignments].filter(item => item.assignment_role === 'inspector').sort((a, b) => String(b.assigned_at).localeCompare(String(a.assigned_at)))[0]; const visit = inspection.completed_at || inspection.scheduled_at; return { inspector: users.find(item => item.id === assignment?.assigned_user_id)?.name || '', cliente: reportCompanyName(provider), ruc: provider.ruc, razonSocial: provider.razonSocial, proveedor: provider.razonSocial, fechaAsignacion: reportDate(assignment?.assigned_at), subStatus: provider.flujo?.subestado || '', fechaVisita: reportDate(visit), dias: reportDayDiff(assignment?.assigned_at, visit) }; })).sort((a, b) => String(b.fechaVisita || '').localeCompare(String(a.fechaVisita || '')))
                    : items.sort((a, b) => String(a.razonSocial).localeCompare(String(b.razonSocial))).map(provider => { const history = [...(workflowHistory.get(provider.id) || [])].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))); const milestone = (codes) => history.find(event => codes.includes(String(event.transition_code)))?.created_at; const assignment = [...dossier(provider.id).assignments].filter(item => item.assignment_role === 'ejecutiva').sort((a, b) => String(a.assigned_at).localeCompare(String(b.assigned_at)))[0]; const fechaAsignacion = reportDate(assignment?.assigned_at || provider.fechaRegistro), coordinacion = reportDate(milestone(['INICIAR_COORDINACION'])), resultado = reportDate(milestone(['REGISTRAR_PAGO', 'MARCAR_NO_PARTICIPA', 'DESESTIMAR_INSCRIPCION', 'DESESTIMAR_VISITA'])), envio = reportDate(milestone(['ENVIAR_FORMULARIO'])), devolucion = reportDate(milestone(['RECIBIR_FORMULARIO'])), homologacion = reportDate(milestone(['EMITIR_ENTREGABLE', 'REGISTRAR_CERTIFICADO_EXISTENTE'])); return { ejecutiva: reportExecutiveName(provider), ruc: provider.ruc, cliente: reportCompanyName(provider), razonSocial: provider.razonSocial, fechaAsignacion, enCoordinacion: coordinacion, diasCoordinacion: reportDayDiff(fechaAsignacion, coordinacion), pagoResultado: resultado, envioFormulario: envio, diasEnvioFormulario: reportDayDiff(resultado, envio), fechaDevolucionFormulario: devolucion, diasDevolucionFormulario: reportDayDiff(envio, devolucion), fechaHomologacion: homologacion, diasHomologacion: reportDayDiff(devolucion, homologacion), diasTotales: reportDayDiff(fechaAsignacion, homologacion) }; });
    const reportColumns = operationalReportColumns[type];
    return { type, columns: reportColumns, rows: rawRows.map((row, index) => { const normalized = {}; for (const column of reportColumns)
            normalized[column.key] = row[column.key] ?? null; if ('nro' in normalized)
            normalized.nro = index + 1; return normalized; }) };
}
memoryRouter.get('/reports/operational/preview/users', requireUser, (request, response) => {
    const user = response.locals.user, processId = String(request.query.processId || ''), process = processes.find(item => item.id === processId);
    if (!process)
        return response.status(404).json({ error: 'Proceso no encontrado.' });
    if (!scoped(user, process.empresaId))
        return response.status(403).json({ error: 'Proceso fuera de tu alcance.' });
    const ids = new Set();
    for (const provider of providers.filter(item => item.procesoId === processId))
        for (const id of reportUserIds(provider))
            ids.add(id);
    response.json({ users: users.filter(item => ids.has(item.id)).map(item => ({ id: item.id, name: item.name })) });
});
memoryRouter.get('/reports/operational/preview', requireUser, (request, response) => {
    const user = response.locals.user, processId = String(request.query.processId || ''), type = String(request.query.type || ''), process = processes.find(item => item.id === processId);
    if (!operationalReportColumns[type])
        return response.status(400).json({ error: 'Debes indicar proceso y tipo de reporte válidos.' });
    if (!process)
        return response.status(404).json({ error: 'Proceso no encontrado.' });
    if (!scoped(user, process.empresaId))
        return response.status(403).json({ error: 'Proceso fuera de tu alcance.' });
    const userId = user.role === 'ejecutiva' ? user.id : (String(request.query.userId || '') || null);
    response.json(buildMemoryOperationalReport(type, processId, user, userId));
});
memoryRouter.get('/reports/operational/export', requireUser, async (request, response) => {
    const user = response.locals.user, processId = String(request.query.processId || ''), type = String(request.query.type || ''), process = processes.find(item => item.id === processId);
    if (!operationalReportColumns[type])
        return response.status(400).json({ error: 'Debes indicar proceso y tipo de reporte válidos.' });
    if (!process)
        return response.status(404).json({ error: 'Proceso no encontrado.' });
    if (!scoped(user, process.empresaId))
        return response.status(403).json({ error: 'Proceso fuera de tu alcance.' });
    const userId = user.role === 'ejecutiva' ? user.id : (String(request.query.userId || '') || null), report = buildMemoryOperationalReport(type, processId, user, userId);
    const requestedColumns = typeof request.query.columns === 'string' ? request.query.columns.split(',').filter(Boolean) : report.columns.map(column => column.key), allowed = new Set(report.columns.map(column => column.key)), selected = requestedColumns.filter(key => allowed.has(key));
    if (!selected.length)
        return response.status(400).json({ error: 'Selecciona al menos una columna.' });
    const company = companies.find(item => item.id === process.empresaId), search = typeof request.query.search === 'string' ? request.query.search.trim().toLocaleLowerCase('es-PE') : '';
    const rows = search ? report.rows.filter(row => selected.some(key => String(row[key] ?? '').toLocaleLowerCase('es-PE').includes(search))) : report.rows;
    const bytes = await buildOperationalWorkbook({ ...report, rows }, selected, { title: operationalReportTitles[type], company: String(company?.nombreComercial || company?.razonSocial || ''), process: String(process.codigo || '') });
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.setHeader('Content-Disposition', `attachment; filename="${type}-${processId}.xlsx"`);
    response.send(bytes);
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
function memoryTransitions(provider, user) { return availableTransitions(memoryState(provider), user.role).map(item => ({ codigo: item.code, etiqueta: item.label, datosObligatorios: [...(item.requiredFields || [])], estadoDestino: item.to.status, subestadoDestino: item.to.substatus })); }
