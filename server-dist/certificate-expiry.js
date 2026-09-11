export function expiryTransition(substatus, validUntil, asOf) {
    if (!validUntil || !['VIGENTE', 'POR_VENCER'].includes(substatus))
        return null;
    const expiry = new Date(`${validUntil.slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(expiry.getTime()))
        return null;
    const today = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
    if (expiry < today && substatus !== 'VENCIDO')
        return 'MARCAR_VENCIDO';
    const fortyFiveDays = new Date(today);
    fortyFiveDays.setUTCDate(fortyFiveDays.getUTCDate() + 45);
    if (expiry <= fortyFiveDays && substatus === 'VIGENTE')
        return 'MARCAR_POR_VENCER';
    return null;
}
