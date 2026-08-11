import { useMemo, useState, type FormEvent } from 'react';
import ProveedoresTable from '../../components/proveedores/ProveedoresTable';
import { useAuth } from '../../src/auth/AuthContext';
import { useProveedores } from '../../src/providers/ProveedoresContext';
import type { Proveedor } from '../../types';
import { useTenant } from '../../src/tenant/TenantContext';

const emptyForm = { ruc: '', razonSocial: '', personaContacto: '', telefonos: '', email: '', direccion: '', departamento: '', distrito: '', actividadPrincipal: '' };

function ProveedoresPage() {
  const { user } = useAuth();
  const { proveedores, addProveedor, updateEstado } = useProveedores();
  const { selectedEmpresa, selectedProceso } = useTenant();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const canEdit = user?.role === 'ejecutiva' || user?.role === 'supervisor_empresa' || user?.role === 'supervisor_general';

  const proveedoresFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return proveedores;
    return proveedores.filter((proveedor) => proveedor.razonSocial.toLowerCase().includes(term) || proveedor.ruc.includes(term) || proveedor.distrito.toLowerCase().includes(term));
  }, [proveedores, search]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit || !selectedEmpresa || !selectedProceso) return;
    if (proveedores.some((item) => item.ruc === form.ruc)) {
      setMessage('Ya existe un proveedor registrado con ese RUC.');
      return;
    }
    addProveedor({ ...form, id: crypto.randomUUID(), empresaId: selectedEmpresa.id, procesoId: selectedProceso.id, estado: 'En proceso', estadoEjecutiva: 'Contactado', calificacion: 0, fechaRegistro: new Date().toLocaleDateString('es-PE'), vigencia: 'N/A' });
    setForm(emptyForm);
    setShowForm(false);
    setMessage('Proveedor registrado correctamente.');
  };

  const setField = (field: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="container">
      <section className="card">
        <div className="section-heading">
          <div>
            <h2 className="page-title">Información de proveedores</h2>
            <p className="context-label">{selectedEmpresa?.razonSocial || 'Sin empresa'} · {selectedProceso?.codigo || 'Sin proceso'}</p>
            <p className="secondary-text">{canEdit ? 'Registra proveedores y administra el estado de su homologación.' : 'Consulta el directorio y estado de los proveedores en modo solo lectura.'}</p>
          </div>
          {canEdit && selectedProceso ? <button type="button" className="btn-primary" onClick={() => setShowForm((visible) => !visible)}>{showForm ? 'Cancelar' : '+ Nuevo proveedor'}</button> : <span className="readonly-badge">{canEdit ? 'Selecciona un proceso' : 'Solo lectura'}</span>}
        </div>

        {showForm && canEdit ? (
          <form className="provider-form" onSubmit={handleSubmit}>
            <h3>Datos del nuevo proveedor</h3>
            {Object.entries({ ruc: 'RUC', razonSocial: 'Razón social', personaContacto: 'Persona de contacto', telefonos: 'Teléfono', email: 'Correo electrónico', direccion: 'Dirección', departamento: 'Departamento', distrito: 'Distrito', actividadPrincipal: 'Actividad principal' }).map(([field, label]) => (
              <label key={field}>{label}<input type={field === 'email' ? 'email' : 'text'} inputMode={field === 'ruc' ? 'numeric' : undefined} minLength={field === 'ruc' ? 11 : undefined} maxLength={field === 'ruc' ? 11 : undefined} value={form[field as keyof typeof form]} onChange={(event) => setField(field as keyof typeof emptyForm, event.target.value)} required /></label>
            ))}
            <button className="btn-primary" type="submit">Guardar proveedor</button>
          </form>
        ) : null}

        {message ? <p className="success-message" role="status">{message}</p> : null}
        <input className="search-input" type="search" placeholder="Buscar proveedor, RUC o distrito..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <ProveedoresTable proveedores={proveedoresFiltrados} role={user?.role} canEdit={canEdit} onStatusChange={updateEstado} />
      </section>
    </div>
  );
}

export default ProveedoresPage;
