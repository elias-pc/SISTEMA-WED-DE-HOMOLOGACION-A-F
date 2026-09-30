export interface DocumentTypeParameter { name: string; validityDays: number }
export interface HomologationConfig {
  filters: string[];
  documentTypes: DocumentTypeParameter[];
  opinions: string[];
  evaluationModules: string[];
}

export const defaultHomologationConfig: HomologationConfig = {
  filters: [],
  documentTypes: [
    { name: 'Certificado', validityDays: 360 },
    { name: 'Constancia', validityDays: 360 },
  ],
  opinions: ['Apto', 'No Apto', 'Otros'],
  evaluationModules: [
    'Formalidad y legales', 'Capacidad operativa', 'Producción y servicios', 'SSO', 'Ambiental',
    'Calidad', 'Inocuidad - HACCP', 'Responsabilidad social', 'Sostenibilidad', 'BASC', 'POES',
    'Comerciales', 'Protección de datos', 'Económica-financiera', 'Otros',
  ],
};

function cleanList(values: unknown, maximum: number) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))].slice(0, maximum);
}

export function normalizeHomologationConfig(value: unknown): HomologationConfig {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const documentTypes = Array.isArray(source.documentTypes)
    ? source.documentTypes.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      const name = String(row.name ?? '').trim();
      const validityDays = Number(row.validityDays);
      return name && Number.isInteger(validityDays) && validityDays >= 1 && validityDays <= 3650 ? [{ name, validityDays }] : [];
    }).slice(0, 12)
    : [];
  return {
    filters: cleanList(source.filters, 2),
    documentTypes: documentTypes.length ? documentTypes : defaultHomologationConfig.documentTypes,
    opinions: cleanList(source.opinions, 12).length ? cleanList(source.opinions, 12) : defaultHomologationConfig.opinions,
    evaluationModules: cleanList(source.evaluationModules, 30).length ? cleanList(source.evaluationModules, 30) : defaultHomologationConfig.evaluationModules,
  };
}

export function automaticExpirationDate(issuedOn: unknown, validityDays: number) {
  const issued = String(issuedOn ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issued)) return null;
  const date = new Date(`${issued}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return null;
  date.setUTCDate(date.getUTCDate() + validityDays);
  return date.toISOString().slice(0, 10);
}
