export type MyPortfolioCategory = 'nuevos' | 'gestion' | 'prioritarios';

export interface MyPortfolioInput {
  id: string;
  legalName: string;
  taxId: string;
  currentStep: number;
  workflowStatus: string;
  workflowSubstatus: string;
  assignedAt: unknown;
  validUntil: unknown;
}

export interface MyPortfolioProvider {
  id: string;
  razonSocial: string;
  ruc: string;
  paso: number;
  estado: string;
  subestado: string;
  fechaAsignacion: string | null;
  fechaVencimiento: string | null;
  categoria: MyPortfolioCategory;
  alerta: string | null;
}

const prioritySubstatuses = new Set([
  'DATOS_INCOMPLETOS', 'NO_UBICADO', 'NO_RESPONDE', 'NO_PARTICIPA',
  'DESESTIMADO', 'NO_ES_PROVEEDOR', 'VENCIDO', 'POR_VENCER',
  'LEVANTAMIENTO_OBSERVACIONES', 'PENDIENTE_ENTREGABLES',
]);

function dateOnly(value: unknown): Date | null {
  if (!value) return null;
  const text = String(value);
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (parts) return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  const parsed = new Date(text);
  if (!Number.isFinite(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function isoDate(value: unknown): string | null {
  const date = dateOnly(value);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function priorityAlert(input: MyPortfolioInput, today: Date): string | null {
  const expiry = dateOnly(input.validUntil);
  if (expiry) {
    const days = Math.round((expiry.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) return 'Certificado vencido';
    if (days === 0) return 'Certificado vence hoy';
    if (days <= 45) return `Certificado vence en ${days} día${days === 1 ? '' : 's'}`;
  }
  if (prioritySubstatuses.has(input.workflowSubstatus)) return input.workflowSubstatus.replaceAll('_', ' ').toLowerCase();
  return null;
}

/** Clasifica una cartera sin modificar su historial ni el flujo del proveedor. */
export function buildMyPortfolio(inputs: MyPortfolioInput[], referenceDate = new Date()) {
  const today = startOfDay(referenceDate);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  let newToday = 0;
  let newWeek = 0;
  let inProgress = 0;
  let priority = 0;

  const providers: MyPortfolioProvider[] = inputs.map((input) => {
    const assigned = dateOnly(input.assignedAt);
    const alert = priorityAlert(input, today);
    const isNew = Boolean(assigned && assigned >= weekStart && assigned <= today);
    const isNewToday = Boolean(assigned && assigned.getTime() === today.getTime());
    let category: MyPortfolioCategory;
    if (alert) { category = 'prioritarios'; priority += 1; }
    else if (isNew) { category = 'nuevos'; if (isNewToday) newToday += 1; newWeek += 1; }
    else { category = 'gestion'; inProgress += 1; }
    return {
      id: input.id, razonSocial: input.legalName, ruc: input.taxId,
      paso: input.currentStep, estado: input.workflowStatus, subestado: input.workflowSubstatus,
      fechaAsignacion: isoDate(input.assignedAt), fechaVencimiento: isoDate(input.validUntil),
      categoria: category, alerta: alert,
    };
  });

  return { summary: { total: providers.length, newToday, newWeek, inProgress, priority }, providers };
}
