import { useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import type { Proveedor } from '../../types';

interface Props {
  provider: Proveedor;
  filterLabel: string;
  canEditIdentity: boolean;
  onSaved: (provider: Proveedor, changes: number) => void;
  onCancel: () => void;
}

const contactFields: Array<{ key: keyof Proveedor; label: string; type?: string }> = [
  { key: 'personaContacto', label: 'Persona de contacto' },
  { key: 'telefonos', label: 'Teléfonos' },
  { key: 'email', label: 'Correo electrónico', type: 'email' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'distrito', label: 'Distrito' },
  { key: 'actividadPrincipal', label: 'Actividad principal' },
];

const lockedStyle = { background: '#eef2f7', color: '#64748b', cursor: 'not-allowed' } as const;

/** Formulario para corregir los datos de un proveedor. RUC y razón social solo los edita el administrador. */
function ProviderDataEditor({ provider, filterLabel, canEditIdentity, onSaved, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ruc: provider.ruc, razonSocial: provider.razonSocial,
    ...Object.fromEntries(contactFields.map(({ key }) => [key, String(provider[key] ?? '')])),
    filtro_1: provider.atributos?.filtro_1 || '',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const payload: Record<string, unknown> = Object.fromEntries(contactFields.map(({ key }) => [key, values[key].trim()]));
      if (canEditIdentity) { payload.ruc = values.ruc.trim(); payload.razonSocial = values.razonSocial.trim(); }
      payload.atributos = { filtro_1: values.filtro_1.trim() };
      const result = await api.updateProvider(provider.id, payload);
      onSaved(result.provider, result.cambios);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar los datos.'); }
    finally { setBusy(false); }
  };

  return (
    <form className="transition-form" onSubmit={save} style={{ marginTop: '1.25rem', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '.8rem', background: '#fafbfd' }}>
      <h4 style={{ margin: 0 }}>Editar datos del proveedor</h4>
      <p className="secondary-text" style={{ margin: 0 }}>Cada cambio queda registrado con tu nombre, el valor anterior y el nuevo.{canEditIdentity ? '' : ' El RUC y la razón social solo los puede cambiar el administrador.'}</p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '.8rem' }}>
        <label>RUC<input id="editar-prov-ruc" value={values.ruc} onChange={(event) => set('ruc', event.target.value)} inputMode="numeric" minLength={11} maxLength={11} pattern="\d{11}" required disabled={!canEditIdentity} style={canEditIdentity ? undefined : lockedStyle} title={canEditIdentity ? undefined : 'Solo el administrador puede cambiarlo'} /></label>
        <label>Razón social<input id="editar-prov-razon" value={values.razonSocial} onChange={(event) => set('razonSocial', event.target.value)} minLength={2} required disabled={!canEditIdentity} style={canEditIdentity ? undefined : lockedStyle} title={canEditIdentity ? undefined : 'Solo el administrador puede cambiarlo'} /></label>
        {contactFields.map(({ key, label, type }) => <label key={key}>{label}<input id={`editar-prov-${key}`} type={type || 'text'} value={values[key]} onChange={(event) => set(key, event.target.value)} /></label>)}
        <label>{filterLabel}<input id="editar-prov-filtro" value={values.filtro_1} onChange={(event) => set('filtro_1', event.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar datos'}</button>
      </div>
    </form>
  );
}

export default ProviderDataEditor;
