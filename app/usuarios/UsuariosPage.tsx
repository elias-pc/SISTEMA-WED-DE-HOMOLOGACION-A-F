import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import { useTenant } from '../../src/tenant/TenantContext';
import type { AuthUser, UserRole } from '../../types';

type InternalRole = Extract<UserRole, 'ejecutiva' | 'jefe_inspecciones' | 'inspector'>;

const roleOptions: Array<{ value: InternalRole; label: string; help: string }> = [
  { value: 'ejecutiva', label: 'Ejecutiva', help: 'Contacta a los proveedores de su cartera, registra pagos, formularios y entregables.' },
  { value: 'jefe_inspecciones', label: 'Jefe de inspectores', help: 'Asigna y reasigna las visitas a los inspectores.' },
  { value: 'inspector', label: 'Inspector', help: 'Programa y registra las visitas de los proveedores que tiene asignados.' },
];
const roleLabel = (role: UserRole) => roleOptions.find((option) => option.value === role)?.label || role;
const roleColor: Record<string, string> = { ejecutiva: '#b0420f', jefe_inspecciones: '#5b3f9e', inspector: '#0f6b6b' };

const emptyForm = { name: '', email: '', role: 'ejecutiva' as InternalRole, password: '', empresaIds: [] as string[] };
type Feedback = { kind: 'success' | 'error'; text: string } | null;

function UsuariosPage() {
  const { empresasDisponibles } = useTenant();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'' | InternalRole>('');
  const [showInactive, setShowInactive] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [editing, setEditing] = useState<AuthUser | null>(null);

  const companyName = useCallback((id: string) => empresasDisponibles.find((empresa) => empresa.id === id)?.nombreComercial || id, [empresasDisponibles]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers((await api.internalUsers()).users); }
    catch (error) { setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudo cargar la lista de usuarios.' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visibleUsers = useMemo(() => users.filter((user) => (!roleFilter || user.role === roleFilter) && (showInactive || user.active !== false)), [users, roleFilter, showInactive]);
  const counts = useMemo(() => Object.fromEntries(roleOptions.map((option) => [option.value, users.filter((user) => user.role === option.value && user.active !== false).length])), [users]);

  const toggleFormCompany = (id: string) => setForm((current) => ({ ...current, empresaIds: current.empresaIds.includes(id) ? current.empresaIds.filter((item) => item !== id) : [...current.empresaIds, id] }));

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.empresaIds.length) { setFeedback({ kind: 'error', text: 'Marca al menos una empresa a la que atenderá el usuario.' }); return; }
    setBusy(true); setFeedback(null);
    try {
      await api.createUser({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, role: form.role, empresaIds: form.empresaIds });
      setFeedback({ kind: 'success', text: `${roleLabel(form.role)} «${form.name.trim()}» creado. Ya puede iniciar sesión con su correo y la contraseña indicada.` });
      setForm(emptyForm); setCreating(false); await load();
    } catch (error) { setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudo crear el usuario.' }); }
    finally { setBusy(false); }
  };

  const toggleActive = async (user: AuthUser) => {
    setFeedback(null);
    try {
      const next = user.active === false;
      await api.updateUser(user.id, { active: next });
      setFeedback({ kind: 'success', text: next ? `${user.name} fue reactivado.` : `${user.name} fue desactivado y ya no puede iniciar sesión.` });
      await load();
    } catch (error) { setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudo cambiar el estado del usuario.' }); }
  };

  return (
    <div className="container">
      <section className="card">
        <div className="section-heading" style={{ alignItems: 'center' }}>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <h2 className="page-title">Usuarios internos</h2>
            <p className="secondary-text">Crea y administra a las ejecutivas, jefes de inspectores e inspectores de A&amp;F, e indica a qué empresas atiende cada uno.</p>
          </div>
          <div className="provider-actions" style={{ alignItems: 'center', justifyContent: 'flex-end', marginLeft: 'auto' }}>
            <select aria-label="Filtrar por rol" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as '' | InternalRole)} style={{ padding: '0.6rem 0.7rem', border: '1px solid #dbe0e8', borderRadius: '0.9rem', background: '#fff', fontSize: '0.9rem' }}>
              <option value="">Todos los roles</option>
              {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label} ({counts[option.value] || 0})</option>)}
            </select>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.88rem' }}><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />Ver inactivos</label>
            <button type="button" className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '0.6rem 1rem', fontSize: '0.9rem' }} onClick={() => { setCreating((open) => !open); setFeedback(null); }}>{creating ? 'Cancelar' : '+ Nuevo usuario'}</button>
          </div>
        </div>

        {feedback ? <p className={feedback.kind === 'success' ? 'success-message' : 'form-error'} role="status" style={{ marginTop: '1rem' }}>{feedback.text}</p> : null}

        {creating ? (
          <form className="provider-form" onSubmit={createUser}>
            <h3>Nuevo usuario interno</h3>
            <label>Nombre completo<input id="nuevo-nombre" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} minLength={2} required /></label>
            <label>Correo electrónico<input id="nuevo-correo" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required /></label>
            <label>Rol<select id="nuevo-rol" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as InternalRole }))}>{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label>Contraseña inicial<input id="nuevo-clave" type="text" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} minLength={8} required /><small className="secondary-text">Mínimo 8 caracteres. Compártela con el usuario de forma privada.</small></label>
            <fieldset style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '.5rem 1.2rem', margin: 0, padding: '.6rem .8rem .8rem', border: '1px solid var(--color-border)', borderRadius: '.7rem' }}>
              <legend style={{ padding: '0 .3rem', fontSize: '.85rem', fontWeight: 600 }}>Empresas que atiende</legend>
              {empresasDisponibles.map((empresa) => <label key={empresa.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontWeight: 500 }}><input type="checkbox" checked={form.empresaIds.includes(empresa.id)} onChange={() => toggleFormCompany(empresa.id)} />{empresa.nombreComercial}</label>)}
            </fieldset>
            <p className="secondary-text" style={{ gridColumn: '1 / -1', margin: 0 }}>{roleOptions.find((option) => option.value === form.role)?.help}</p>
            <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Creando…' : 'Crear usuario'}</button>
          </form>
        ) : null}

        <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '880px' }}>
            <thead>
              <tr>{['Nombre', 'Correo', 'Rol', 'Empresas', 'Capacidad', 'Estado', 'Acciones'].map((header) => <th key={header} style={{ textAlign: 'left', padding: '0.9rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id} style={{ borderTop: '1px solid var(--color-border)', opacity: user.active === false ? 0.6 : 1 }}>
                  <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600 }}>{user.name}</td>
                  <td style={{ padding: '0.85rem 0.75rem' }}>{user.email}</td>
                  <td style={{ padding: '0.85rem 0.75rem' }}><span style={{ display: 'inline-block', padding: '.2rem .6rem', borderRadius: '999px', border: `1px solid ${roleColor[user.role] || '#64748b'}`, color: roleColor[user.role] || '#64748b', fontSize: '.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{roleLabel(user.role)}</span></td>
                  <td style={{ padding: '0.85rem 0.75rem' }}>{user.empresaIds.length ? user.empresaIds.map(companyName).join(', ') : '—'}</td>
                  <td style={{ padding: '0.85rem 0.75rem', whiteSpace: 'nowrap' }}>{user.role === 'ejecutiva' ? `${user.capacidad ?? 40} proveedores` : '—'}</td>
                  <td style={{ padding: '0.85rem 0.75rem', whiteSpace: 'nowrap' }}>{user.active === false ? 'Inactivo' : 'Activo'}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                      <button type="button" className="btn-secondary table-action" onClick={() => { setEditing(user); setFeedback(null); }}>Editar</button>
                      <button type="button" className="btn-secondary table-action" onClick={() => void toggleActive(user)}>{user.active === false ? 'Reactivar' : 'Desactivar'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading ? <p className="secondary-text" style={{ textAlign: 'center' }}>Cargando usuarios…</p> : !visibleUsers.length ? <p className="secondary-text" style={{ textAlign: 'center' }}>No hay usuarios con ese filtro. Usa «+ Nuevo usuario» para crear el primero.</p> : null}
        </div>
      </section>
      {editing ? <EditUserModal user={editing} companies={empresasDisponibles} onClose={() => setEditing(null)} onSaved={async (text) => { setEditing(null); setFeedback({ kind: 'success', text }); await load(); }} /> : null}
    </div>
  );
}

function EditUserModal({ user, companies, onClose, onSaved }: { user: AuthUser; companies: Array<{ id: string; nombreComercial: string }>; onClose: () => void; onSaved: (text: string) => Promise<void> }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [empresaIds, setEmpresaIds] = useState<string[]>(user.empresaIds);
  const [password, setPassword] = useState('');
  const [capacity, setCapacity] = useState(String(user.capacidad ?? 40));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!empresaIds.length) { setError('Marca al menos una empresa.'); return; }
    setBusy(true); setError('');
    try {
      const capacityValue = Number(capacity);
      if (user.role === 'ejecutiva' && (!Number.isInteger(capacityValue) || capacityValue < 1 || capacityValue > 1000)) { setError('La capacidad debe ser un número entero entre 1 y 1000.'); setBusy(false); return; }
      const capacityChanged = user.role === 'ejecutiva' && capacityValue !== (user.capacidad ?? 40);
      if (name.trim() !== user.name || email.trim().toLowerCase() !== user.email || capacityChanged) await api.updateUser(user.id, { name: name.trim(), email: email.trim().toLowerCase(), ...(capacityChanged ? { capacidad: capacityValue } : {}) });
      const companiesChanged = empresaIds.length !== user.empresaIds.length || empresaIds.some((id) => !user.empresaIds.includes(id));
      if (companiesChanged) await api.updateExecutiveCompanies(user.id, empresaIds);
      if (password) await api.resetUserPassword(user.id, password);
      await onSaved(password ? `Cambios guardados. La nueva contraseña de ${name.trim()} ya está activa.` : 'Cambios guardados.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar los cambios.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="deliverables-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="card" role="dialog" aria-modal="true" aria-labelledby="editar-usuario-titulo" onMouseDown={(event) => event.stopPropagation()} onSubmit={save} style={{ width: 'min(560px, 100%)', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto', margin: 0, display: 'grid', gap: '1rem' }}>
        <div className="section-heading" style={{ alignItems: 'center' }}>
          <div><p className="context-label">{roleLabel(user.role)}</p><h3 id="editar-usuario-titulo" style={{ margin: 0 }}>Editar usuario</h3></div>
          <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <label style={{ display: 'grid', gap: '.35rem', fontWeight: 600, fontSize: '.88rem' }}>Nombre completo<input id="editar-nombre" className="search-input" style={{ marginTop: 0 }} value={name} onChange={(event) => setName(event.target.value)} minLength={2} required /></label>
        <label style={{ display: 'grid', gap: '.35rem', fontWeight: 600, fontSize: '.88rem' }}>Correo electrónico<input id="editar-correo" className="search-input" style={{ marginTop: 0 }} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        {user.role === 'ejecutiva' ? <label style={{ display: 'grid', gap: '.35rem', fontWeight: 600, fontSize: '.88rem' }}>Capacidad de cartera (proveedores)<input id="editar-capacidad" className="search-input" style={{ marginTop: 0 }} type="number" min={1} max={1000} value={capacity} onChange={(event) => setCapacity(event.target.value)} required /><small className="secondary-text" style={{ fontWeight: 400 }}>Cuántos proveedores puede atender. Se usa para la barra de carga en «Cartera de ejecutivas».</small></label> : null}
        <fieldset style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem 1.2rem', margin: 0, padding: '.6rem .8rem .8rem', border: '1px solid var(--color-border)', borderRadius: '.7rem' }}>
          <legend style={{ padding: '0 .3rem', fontSize: '.85rem', fontWeight: 600 }}>Empresas que atiende</legend>
          {companies.map((company) => <label key={company.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><input type="checkbox" checked={empresaIds.includes(company.id)} onChange={() => setEmpresaIds((current) => current.includes(company.id) ? current.filter((id) => id !== company.id) : [...current, company.id])} />{company.nombreComercial}</label>)}
        </fieldset>
        <label style={{ display: 'grid', gap: '.35rem', fontWeight: 600, fontSize: '.88rem' }}>Nueva contraseña (opcional)<input id="editar-clave" className="search-input" style={{ marginTop: 0 }} type="text" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} placeholder="Déjala vacía para no cambiarla" /><small className="secondary-text" style={{ fontWeight: 400 }}>Al cambiarla se cierran las sesiones abiertas del usuario.</small></label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </div>
  );
}

export default UsuariosPage;
