export function expiryTransition(substatus, validUntil, asOf) {
    if (!validUntil || !['VIGENTE', 'POR_VENCER'].includes(substatus))
        return null;
    // PostgreSQL puede entregar la fecha como objeto Date: se normaliza a AAAA-MM-DD antes de comparar.
    const isoDate = validUntil instanceof Date ? validUntil.toISOString().slice(0, 10) : String(validUntil).slice(0, 10);
    const expiry = new Date(`${isoDate}T00:00:00.000Z`);
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
