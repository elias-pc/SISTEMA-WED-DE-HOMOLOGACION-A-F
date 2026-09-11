import * as XLSX from 'xlsx';

export interface ImportedProviderRow {
  rowNumber: number;
  raw: Record<string, string>;
  provider?: {
    ruc: string;
    razonSocial: string;
    personaContacto: string;
    telefonos: string;
    email: string;
    direccion: string;
    departamento: string;
    distrito: string;
    actividadPrincipal: string;
    attributes: Record<string, string>;
  };
  errors: string[];
}

const aliases: Record<string, string[]> = {
  ruc: ['ruc'],
  razonSocial: ['razon social', 'proveedor', 'nombre o razon social'],
  personaContacto: ['persona de contacto', 'contacto', 'contacto comercial'],
  telefonos: ['telefono', 'telefonos', 'celular'],
  email: ['correo electronico', 'correo', 'email'],
  direccion: ['direccion', 'domicilio'],
  departamento: ['departamento'],
  distrito: ['distrito'],
  actividadPrincipal: ['actividad principal', 'actividad'],
};

const required = Object.keys(aliases) as Array<keyof typeof aliases>;
const normalize = (value: unknown) => String(value ?? '').trim();
const normalizeKey = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function valueFor(raw: Record<string, string>, key: keyof typeof aliases) {
  const header = Object.keys(raw).find((candidate) => aliases[key].includes(normalizeKey(candidate)));
  return header ? normalize(raw[header]) : '';
}

export function parseProviderWorkbook(contentBase64: string): ImportedProviderRow[] {
  const buffer = Buffer.from(contentBase64, 'base64');
  if (!buffer.length || buffer.length > 2 * 1024 * 1024) throw new Error('El archivo Excel debe pesar entre 1 byte y 2 MB.');
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('El archivo Excel no contiene hojas.');
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '', raw: false });
  if (!rows.length) throw new Error('El archivo Excel no contiene filas de proveedores.');
  const duplicateRucs = new Set<string>();
  const seenRucs = new Set<string>();
  const parsed = rows.map((source, index) => {
    const raw = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, normalize(value)]));
    const values = Object.fromEntries(required.map((key) => [key, valueFor(raw, key)])) as Record<keyof typeof aliases, string>;
    const errors: string[] = [];
    for (const field of required) if (!values[field]) errors.push(`Falta ${field}.`);
    if (values.ruc && !/^\d{11}$/.test(values.ruc)) errors.push('El RUC debe tener 11 dígitos.');
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.push('El correo electrónico no es válido.');
    if (values.ruc) {
      if (seenRucs.has(values.ruc)) duplicateRucs.add(values.ruc);
      seenRucs.add(values.ruc);
    }
    const knownHeaders = new Set(Object.values(aliases).flat());
    const attributes = Object.fromEntries(Object.entries(raw)
      .filter(([header, value]) => value && !knownHeaders.has(normalizeKey(header)))
      .map(([header, value]) => [normalizeKey(header).replace(/ /g, '_').slice(0, 80), value]));
    return {
      rowNumber: index + 2, raw, errors,
      provider: errors.length ? undefined : { ...values, attributes },
    } as ImportedProviderRow;
  });
  for (const row of parsed) if (row.provider && duplicateRucs.has(row.provider.ruc)) {
    row.errors.push('El RUC está duplicado dentro del archivo.');
    row.provider = undefined;
  }
  return parsed;
}
