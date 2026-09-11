export const workflowSteps = [
    { number: 1, code: 'CREACION_CLIENTE', label: 'Creación del cliente', ownerRole: 'administradora' },
    { number: 2, code: 'REGISTRO_PROVEEDOR', label: 'Registro del proveedor', ownerRole: 'administradora' },
    { number: 3, code: 'ASIGNACION_EJECUTIVA', label: 'Asignación a ejecutiva', ownerRole: 'administradora' },
    { number: 4, code: 'INVITACION_INSCRIPCION', label: 'Invitación e inscripción', ownerRole: 'ejecutiva' },
    { number: 5, code: 'FORMULARIO', label: 'Envío y recepción del formulario', ownerRole: 'ejecutiva' },
    { number: 6, code: 'ASIGNACION_INSPECTOR', label: 'Asignación a inspector', ownerRole: 'jefe_inspecciones' },
    { number: 7, code: 'INSPECCION', label: 'Coordinación y visita', ownerRole: 'inspector' },
    { number: 8, code: 'ENTREGABLES', label: 'Emisión de entregables', ownerRole: 'ejecutiva' },
    { number: 9, code: 'HOMOLOGACION', label: 'Homologación y vigencia', ownerRole: 'ejecutiva' },
];
export const initialProviderWorkflowState = {
    step: 2,
    status: 'PENDIENTE_INSCRIPCION',
    substatus: 'REGISTRADO',
};
export const transitionCodes = [
    'ASIGNAR_EJECUTIVA', 'INICIAR_COORDINACION', 'MARCAR_DATOS_INCOMPLETOS', 'MARCAR_NO_ES_PROVEEDOR',
    'MARCAR_NO_UBICADO', 'MARCAR_NO_RESPONDE', 'DESESTIMAR_INSCRIPCION', 'MARCAR_NO_PARTICIPA',
    'REGISTRAR_CERTIFICADO_EXISTENTE', 'REGISTRAR_PAGO', 'ENVIAR_FORMULARIO', 'RECIBIR_FORMULARIO',
    'ASIGNAR_INSPECTOR', 'PROGRAMAR_VISITA', 'REPROGRAMAR_VISITA', 'MARCAR_NO_UBICADO_VISITA',
    'DESESTIMAR_VISITA', 'RETOMAR_VISITA', 'REGISTRAR_VISITA', 'CONFIRMAR_CONFORMIDAD',
    'EMITIR_ENTREGABLE', 'INICIAR_OBSERVACIONES', 'CERRAR_OBSERVACIONES', 'MARCAR_POR_VENCER', 'MARCAR_VENCIDO',
];
const retryableEnrollmentOutcomes = [
    'DATOS_INCOMPLETOS', 'NO_UBICADO', 'NO_RESPONDE', 'NO_PARTICIPA',
];
export const workflowTransitions = [
    { code: 'ASIGNAR_EJECUTIVA', label: 'Asignar ejecutiva', from: ['REGISTRADO'], to: { step: 3, status: 'PENDIENTE_INSCRIPCION', substatus: 'ASIGNADO_EJECUTIVA' }, roles: ['administradora'], requiredFields: ['ejecutivaId'] },
    { code: 'INICIAR_COORDINACION', label: 'Iniciar o retomar coordinación', from: ['ASIGNADO_EJECUTIVA', ...retryableEnrollmentOutcomes], to: { step: 4, status: 'PENDIENTE_INSCRIPCION', substatus: 'EN_COORDINACION' }, roles: ['ejecutiva'] },
    { code: 'MARCAR_DATOS_INCOMPLETOS', label: 'Marcar datos incompletos', from: ['EN_COORDINACION'], to: { step: 4, status: 'PENDIENTE_INSCRIPCION', substatus: 'DATOS_INCOMPLETOS' }, roles: ['ejecutiva'], requiredFields: ['motivo'] },
    { code: 'MARCAR_NO_ES_PROVEEDOR', label: 'Marcar que no es proveedor', from: ['EN_COORDINACION'], to: { step: 4, status: 'PENDIENTE_INSCRIPCION', substatus: 'NO_ES_PROVEEDOR' }, roles: ['ejecutiva'], requiredFields: ['motivo'] },
    { code: 'MARCAR_NO_UBICADO', label: 'Marcar no ubicado', from: ['EN_COORDINACION'], to: { step: 4, status: 'PENDIENTE_INSCRIPCION', substatus: 'NO_UBICADO' }, roles: ['ejecutiva'], requiredFields: ['motivo'] },
    { code: 'MARCAR_NO_RESPONDE', label: 'Marcar que no responde', from: ['EN_COORDINACION'], to: { step: 4, status: 'PENDIENTE_INSCRIPCION', substatus: 'NO_RESPONDE' }, roles: ['ejecutiva'], requiredFields: ['motivo'] },
    { code: 'DESESTIMAR_INSCRIPCION', label: 'Desestimar inscripción', from: ['EN_COORDINACION'], to: { step: 4, status: 'PENDIENTE_INSCRIPCION', substatus: 'DESESTIMADO' }, roles: ['ejecutiva'], requiredFields: ['motivo'] },
    { code: 'MARCAR_NO_PARTICIPA', label: 'Marcar que no participa', from: ['EN_COORDINACION'], to: { step: 4, status: 'PENDIENTE_INSCRIPCION', substatus: 'NO_PARTICIPA' }, roles: ['ejecutiva'], requiredFields: ['motivo'] },
    { code: 'REGISTRAR_CERTIFICADO_EXISTENTE', label: 'Registrar certificado existente', from: ['EN_COORDINACION'], to: { step: 9, status: 'HOMOLOGADO', substatus: 'VIGENTE' }, roles: ['ejecutiva'], requiredFields: ['tipoDocumento', 'fechaEmision', 'fechaVencimiento'] },
    { code: 'REGISTRAR_PAGO', label: 'Registrar pago', from: ['EN_COORDINACION'], to: { step: 5, status: 'INSCRITO', substatus: 'PAGO_CONFIRMADO' }, roles: ['ejecutiva'], requiredFields: ['banco', 'monto', 'modalidad', 'fechaPago', 'numeroOperacion', 'numeroFactura'] },
    { code: 'ENVIAR_FORMULARIO', label: 'Enviar formulario', from: ['PAGO_CONFIRMADO'], to: { step: 5, status: 'INSCRITO', substatus: 'FORMULARIO_ENVIADO' }, roles: ['ejecutiva'], requiredFields: ['formulario'] },
    { code: 'RECIBIR_FORMULARIO', label: 'Registrar devolución del formulario', from: ['FORMULARIO_ENVIADO'], to: { step: 6, status: 'INSCRITO', substatus: 'FORMULARIO_DEVUELTO' }, roles: ['ejecutiva'], requiredFields: ['documentosConformes'] },
    { code: 'ASIGNAR_INSPECTOR', label: 'Asignar inspector', from: ['FORMULARIO_DEVUELTO'], to: { step: 7, status: 'INSCRITO', substatus: 'INSPECTOR_ASIGNADO' }, roles: ['jefe_inspecciones'], requiredFields: ['inspectorId'] },
    { code: 'PROGRAMAR_VISITA', label: 'Programar visita', from: ['INSPECTOR_ASIGNADO', 'VISITA_REPROGRAMADA', 'NO_UBICADO_VISITA'], to: { step: 7, status: 'INSCRITO', substatus: 'VISITA_EN_COORDINACION' }, roles: ['inspector'], requiredFields: ['fechaVisita', 'modalidadVisita'] },
    { code: 'REPROGRAMAR_VISITA', label: 'Reprogramar visita', from: ['VISITA_EN_COORDINACION'], to: { step: 7, status: 'INSCRITO', substatus: 'VISITA_REPROGRAMADA' }, roles: ['inspector'], requiredFields: ['fechaVisita', 'motivo'] },
    { code: 'MARCAR_NO_UBICADO_VISITA', label: 'Marcar no ubicado para visita', from: ['VISITA_EN_COORDINACION', 'VISITA_REPROGRAMADA'], to: { step: 7, status: 'INSCRITO', substatus: 'NO_UBICADO_VISITA' }, roles: ['inspector'], requiredFields: ['motivo'] },
    { code: 'DESESTIMAR_VISITA', label: 'Desestimar visita', from: ['VISITA_EN_COORDINACION', 'VISITA_REPROGRAMADA', 'NO_UBICADO_VISITA'], to: { step: 7, status: 'INSCRITO', substatus: 'VISITA_DESESTIMADA' }, roles: ['inspector'], requiredFields: ['motivo'] },
    { code: 'RETOMAR_VISITA', label: 'Retomar visita', from: ['VISITA_DESESTIMADA'], to: { step: 7, status: 'INSCRITO', substatus: 'INSPECTOR_ASIGNADO' }, roles: ['jefe_inspecciones'], requiredFields: ['inspectorId', 'motivo'] },
    { code: 'REGISTRAR_VISITA', label: 'Registrar visita realizada', from: ['VISITA_EN_COORDINACION', 'VISITA_REPROGRAMADA'], to: { step: 7, status: 'INSCRITO', substatus: 'VISITA_REALIZADA' }, roles: ['inspector'], requiredFields: ['fechaVisita', 'informeVisita'] },
    { code: 'CONFIRMAR_CONFORMIDAD', label: 'Confirmar conformidad', from: ['VISITA_REALIZADA'], to: { step: 8, status: 'INSCRITO', substatus: 'PENDIENTE_ENTREGABLES' }, roles: ['inspector'], requiredFields: ['documentosConformes'] },
    { code: 'EMITIR_ENTREGABLE', label: 'Emitir entregable', from: ['PENDIENTE_ENTREGABLES'], to: { step: 9, status: 'HOMOLOGADO', substatus: 'VIGENTE' }, roles: ['ejecutiva'], requiredFields: ['tipoDocumento', 'dictamen', 'puntaje', 'fechaEmision', 'fechaVencimiento', 'alcance'] },
    { code: 'INICIAR_OBSERVACIONES', label: 'Iniciar levantamiento de observaciones', from: ['VIGENTE', 'POR_VENCER', 'VENCIDO'], to: { step: 9, status: 'HOMOLOGADO', substatus: 'LEVANTAMIENTO_OBSERVACIONES' }, roles: ['ejecutiva'], requiredFields: ['motivo'] },
    { code: 'CERRAR_OBSERVACIONES', label: 'Cerrar levantamiento de observaciones', from: ['LEVANTAMIENTO_OBSERVACIONES'], to: { step: 9, status: 'HOMOLOGADO', substatus: 'VIGENTE' }, roles: ['ejecutiva'], requiredFields: ['fechaVencimiento'] },
    { code: 'MARCAR_POR_VENCER', label: 'Marcar por vencer', from: ['VIGENTE'], to: { step: 9, status: 'HOMOLOGADO', substatus: 'POR_VENCER' }, roles: ['sistema'] },
    { code: 'MARCAR_VENCIDO', label: 'Marcar vencido', from: ['VIGENTE', 'POR_VENCER'], to: { step: 9, status: 'HOMOLOGADO', substatus: 'VENCIDO' }, roles: ['sistema'] },
];
export function workflowRolesForUserRole(role) {
    if (role === 'supervisor_general')
        return ['administradora'];
    if (role === 'jefe_inspecciones')
        return ['jefe_inspecciones'];
    if (role === 'administradora' || role === 'ejecutiva' || role === 'inspector')
        return [role];
    return [];
}
const expectedStateBySubstatus = {
    REGISTRADO: { step: 2, status: 'PENDIENTE_INSCRIPCION' },
    ASIGNADO_EJECUTIVA: { step: 3, status: 'PENDIENTE_INSCRIPCION' },
    EN_COORDINACION: { step: 4, status: 'PENDIENTE_INSCRIPCION' },
    CERTIFICADO_EXISTENTE: { step: 4, status: 'PENDIENTE_INSCRIPCION' },
    DATOS_INCOMPLETOS: { step: 4, status: 'PENDIENTE_INSCRIPCION' },
    NO_ES_PROVEEDOR: { step: 4, status: 'PENDIENTE_INSCRIPCION' },
    NO_UBICADO: { step: 4, status: 'PENDIENTE_INSCRIPCION' },
    NO_RESPONDE: { step: 4, status: 'PENDIENTE_INSCRIPCION' },
    DESESTIMADO: { step: 4, status: 'PENDIENTE_INSCRIPCION' },
    NO_PARTICIPA: { step: 4, status: 'PENDIENTE_INSCRIPCION' },
    PAGO_CONFIRMADO: { step: 5, status: 'INSCRITO' },
    FORMULARIO_ENVIADO: { step: 5, status: 'INSCRITO' },
    FORMULARIO_DEVUELTO: { step: 6, status: 'INSCRITO' },
    INSPECTOR_ASIGNADO: { step: 7, status: 'INSCRITO' },
    VISITA_EN_COORDINACION: { step: 7, status: 'INSCRITO' },
    VISITA_REPROGRAMADA: { step: 7, status: 'INSCRITO' },
    VISITA_DESESTIMADA: { step: 7, status: 'INSCRITO' },
    NO_UBICADO_VISITA: { step: 7, status: 'INSCRITO' },
    VISITA_REALIZADA: { step: 7, status: 'INSCRITO' },
    PENDIENTE_ENTREGABLES: { step: 8, status: 'INSCRITO' },
    VIGENTE: { step: 9, status: 'HOMOLOGADO' },
    POR_VENCER: { step: 9, status: 'HOMOLOGADO' },
    VENCIDO: { step: 9, status: 'HOMOLOGADO' },
    LEVANTAMIENTO_OBSERVACIONES: { step: 9, status: 'HOMOLOGADO' },
};
export function transitionDefinition(code) {
    return workflowTransitions.find((transition) => transition.code === code);
}
export function availableTransitions(state, role) {
    const roles = role === 'sistema' ? ['sistema'] : workflowRolesForUserRole(role);
    return workflowTransitions.filter((transition) => transition.from.includes(state.substatus) && transition.roles.some((item) => roles.includes(item)));
}
export function validateTransition(state, code, role, data = {}) {
    const transition = transitionDefinition(code);
    if (!transition)
        return { ok: false, error: 'La transición no existe.' };
    const expected = expectedStateBySubstatus[state.substatus];
    if (!expected || expected.step !== state.step || expected.status !== state.status)
        return { ok: false, error: 'El estado actual del proveedor no es consistente con el flujo formal.' };
    if (!transition.from.includes(state.substatus))
        return { ok: false, error: `La transición ${code} no está permitida desde ${state.substatus}.` };
    if (transition.to.step < state.step)
        return { ok: false, error: 'El proceso no puede retroceder a un paso anterior.' };
    const roles = role === 'sistema' ? ['sistema'] : workflowRolesForUserRole(role);
    if (!transition.roles.some((item) => roles.includes(item)))
        return { ok: false, error: 'Tu rol no puede ejecutar esta transición.' };
    const missingFields = (transition.requiredFields || []).filter((field) => data[field] === undefined || data[field] === null || data[field] === '');
    if (missingFields.length)
        return { ok: false, error: `Faltan datos obligatorios: ${missingFields.join(', ')}.`, missingFields };
    return { ok: true, transition };
}
export function applyWorkflowTransition(state, code, role, data = {}) {
    const validation = validateTransition(state, code, role, data);
    if (!validation.ok)
        throw new Error(validation.error);
    return validation.transition.to;
}
export function legacyProviderStatus(state) {
    if (state.status === 'HOMOLOGADO')
        return state.substatus === 'VENCIDO' ? 'Vencido' : 'Homologado';
    if (['DATOS_INCOMPLETOS', 'NO_ES_PROVEEDOR', 'NO_UBICADO', 'NO_RESPONDE', 'DESESTIMADO', 'NO_PARTICIPA', 'NO_UBICADO_VISITA', 'VISITA_DESESTIMADA'].includes(state.substatus))
        return 'Observado';
    return 'En proceso';
}
