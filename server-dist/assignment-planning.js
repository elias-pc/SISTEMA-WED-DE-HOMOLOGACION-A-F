function unique(values) {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
export function buildBalancedAssignmentPlan(providerIds, executiveIds) {
    const providers = unique(providerIds);
    const executives = unique(executiveIds);
    if (!providers.length)
        throw new Error('Selecciona al menos un proveedor.');
    if (!executives.length)
        throw new Error('Selecciona al menos una ejecutiva.');
    return providers.map((providerId, index) => ({ providerId, executiveId: executives[index % executives.length] }));
}
export function buildQuantityAssignmentPlan(providerIds, quantities) {
    const providers = unique(providerIds);
    const normalized = quantities
        .map((item) => ({ executiveId: item.executiveId.trim(), quantity: Number(item.quantity) }))
        .filter((item) => item.executiveId && item.quantity > 0);
    if (!providers.length)
        throw new Error('Selecciona al menos un proveedor.');
    if (!normalized.length)
        throw new Error('Indica una cantidad para al menos una ejecutiva.');
    if (new Set(normalized.map((item) => item.executiveId)).size !== normalized.length)
        throw new Error('Cada ejecutiva debe aparecer una sola vez.');
    if (normalized.some((item) => !Number.isInteger(item.quantity)))
        throw new Error('Las cantidades deben ser números enteros.');
    const requested = normalized.reduce((sum, item) => sum + item.quantity, 0);
    if (requested !== providers.length)
        throw new Error(`Las cantidades deben sumar ${providers.length}.`);
    const plan = [];
    let cursor = 0;
    for (const item of normalized) {
        for (let index = 0; index < item.quantity; index += 1) {
            plan.push({ providerId: providers[cursor], executiveId: item.executiveId });
            cursor += 1;
        }
    }
    return plan;
}
