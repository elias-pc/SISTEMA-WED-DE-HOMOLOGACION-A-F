import { useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import { useTenant } from '../../src/tenant/TenantContext';
import type { ConfiguracionHomologacion, Empresa, ProcesoHomologacion } from '../../types';

const defaultConfiguration: ConfiguracionHomologacion = {
  filters: ['', ''],
  documentTypes: [{ name: 'Certificado', validityDays: 360 }, { name: 'Constancia', validityDays: 360 }],
  opinions: ['Apto', 'No Apto', 'Otros'],
  evaluationModules: ['Formalidad y legales', 'Capacidad operativa', 'Producción y servicios', 'SSO', 'Ambiental', 'Calidad', 'Inocuidad - HACCP', 'Responsabilidad social', 'Sostenibilidad', 'BASC', 'POES', 'Comerciales', 'Protección de datos', 'Económica-financiera', 'Otros'],
};
const initialForm = { razonSocial: '', ruc: '', nombreComercial: '', contacto: '', email: '', telefono: '', nombreProceso: '', codigo: '', fechaInicio: '', fechaLimite: '', clienteEmail: '', clientePassword: '', supervisorEmail: '', supervisorPassword: '' };

function ConfiguracionPage() {
  const { empresas, procesos, createEmpresaConProceso } = useTenant();
  const [form, setForm] = useState(initialForm);
  const [parameters, setParameters] = useState<ConfiguracionHomologacion>(defaultConfiguration);
  const [message, setMessage] = useState('');
  const setField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (empresas.some((item) => item.ruc === form.ruc)) { setMessage('Ya existe una empresa con ese RUC.'); return; }
    const empresaId = `${form.nombreComercial.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const procesoId = `proc-${empresaId}`;
    const cleanConfiguration: ConfiguracionHomologacion = { ...parameters, filters: parameters.filters.map((item) => item.trim()).filter(Boolean), documentTypes: parameters.documentTypes.filter((item) => item.name.trim() && item.validityDays > 0), opinions: parameters.opinions.map((item) => item.trim()).filter(Boolean), evaluationModules: parameters.evaluationModules.map((item) => item.trim()).filter(Boolean) };
    const empresa: Empresa = { id: empresaId, razonSocial: form.razonSocial, ruc: form.ruc, nombreComercial: form.nombreComercial, contacto: form.contacto, email: form.email, telefono: form.telefono, estado: 'Activa', configuracionHomologacion: cleanConfiguration };
    const proceso: ProcesoHomologacion = { id: procesoId, empresaId, codigo: form.codigo, nombre: form.nombreProceso, fechaInicio: form.fechaInicio, fechaLimite: form.fechaLimite, estado: 'Planificación' };
    try {
      await createEmpresaConProceso(empresa, proceso);
      await Promise.all([
        api.createUser({ id: `cliente-${empresaId}`, name: `Cliente ${form.nombreComercial}`, email: form.clienteEmail.trim().toLowerCase(), password: form.clientePassword, role: 'cliente', empresaIds: [empresaId] }),
        api.createUser({ id: `supervisor-${empresaId}`, name: `Supervisor ${form.nombreComercial}`, email: form.supervisorEmail.trim().toLowerCase(), password: form.supervisorPassword, role: 'supervisor_empresa', empresaIds: [empresaId] }),
      ]);
      setForm(initialForm); setParameters(defaultConfiguration);
      setMessage('Empresa, proceso y usuarios creados correctamente.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo crear la empresa.'); }
  };

  return (
    <div className="container">
      <section className="card">
        <h2 className="page-title">Empresas y procesos</h2>
        <p className="secondary-text">Administración exclusiva del supervisor general. Cada empresa mantiene información y supervisión independientes.</p>
        <form className="provider-form" onSubmit={handleSubmit}>
          <h3>Nueva empresa y proceso de homologación</h3>
          <label>Razón social<input value={form.razonSocial} onChange={(e) => setField('razonSocial', e.target.value)} required /></label>
          <label>RUC<input inputMode="numeric" minLength={11} maxLength={11} value={form.ruc} onChange={(e) => setField('ruc', e.target.value)} required /></label>
          <label>Nombre comercial<input value={form.nombreComercial} onChange={(e) => setField('nombreComercial', e.target.value)} required /></label>
          <label>Persona de contacto<input value={form.contacto} onChange={(e) => setField('contacto', e.target.value)} required /></label>
          <label>Correo<input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required /></label>
          <label>Teléfono<input value={form.telefono} onChange={(e) => setField('telefono', e.target.value)} required /></label>
          <label>Nombre del proceso<input value={form.nombreProceso} onChange={(e) => setField('nombreProceso', e.target.value)} required /></label>
          <label>Código del proceso<input placeholder="EMPRESA-2026-001" value={form.codigo} onChange={(e) => setField('codigo', e.target.value)} required /></label>
          <label>Fecha de inicio<input type="date" value={form.fechaInicio} onChange={(e) => setField('fechaInicio', e.target.value)} required /></label>
          <label>Fecha límite<input type="date" value={form.fechaLimite} onChange={(e) => setField('fechaLimite', e.target.value)} required /></label>
          <fieldset className="parameter-fieldset"><legend>Parámetros de homologación del cliente</legend><p className="secondary-text">Define aquí los filtros y criterios que aparecerán para los proveedores de esta empresa.</p>
            <label>Nombre del filtro 1 (opcional)<input value={parameters.filters[0] || ''} placeholder="Ej.: Rubro" onChange={(event) => setParameters((current) => ({ ...current, filters: [event.target.value, current.filters[1] || ''] }))} /></label>
            <label>Nombre del filtro 2 (opcional)<input value={parameters.filters[1] || ''} placeholder="Ej.: Zona" onChange={(event) => setParameters((current) => ({ ...current, filters: [current.filters[0] || '', event.target.value] }))} /></label>
            <div className="parameter-list"><strong>Tipos de documento y plazo de vigencia</strong>{parameters.documentTypes.map((item, index) => <div className="parameter-row" key={`${item.name}-${index}`}><input aria-label={`Tipo de documento ${index + 1}`} value={item.name} onChange={(event) => setParameters((current) => ({ ...current, documentTypes: current.documentTypes.map((entry, row) => row === index ? { ...entry, name: event.target.value } : entry) }))} /><input aria-label={`Días de vigencia ${index + 1}`} type="number" min="1" max="3650" value={item.validityDays} onChange={(event) => setParameters((current) => ({ ...current, documentTypes: current.documentTypes.map((entry, row) => row === index ? { ...entry, validityDays: Number(event.target.value) } : entry) }))} /><span>días</span><button type="button" className="btn-secondary" disabled={parameters.documentTypes.length <= 1} onClick={() => setParameters((current) => ({ ...current, documentTypes: current.documentTypes.filter((_, row) => row !== index) }))}>Quitar</button></div>)}<button type="button" className="btn-secondary" onClick={() => setParameters((current) => ({ ...current, documentTypes: [...current.documentTypes, { name: '', validityDays: 360 }] }))}>+ Agregar tipo</button></div>
            <label>Dictámenes (uno por línea)<textarea value={parameters.opinions.join('\n')} onChange={(event) => setParameters((current) => ({ ...current, opinions: event.target.value.split('\n') }))} rows={3} /></label>
            <label>Módulos de evaluación (uno por línea)<textarea value={parameters.evaluationModules.join('\n')} onChange={(event) => setParameters((current) => ({ ...current, evaluationModules: event.target.value.split('\n') }))} rows={6} /></label>
          </fieldset>
          <label>Correo del usuario cliente<input type="email" value={form.clienteEmail} onChange={(e) => setField('clienteEmail', e.target.value)} required /></label>
          <label>Contraseña inicial<input type="text" minLength={8} value={form.clientePassword} onChange={(e) => setField('clientePassword', e.target.value)} required /></label>
          <label>Correo del supervisor de empresa<input type="email" value={form.supervisorEmail} onChange={(e) => setField('supervisorEmail', e.target.value)} required /></label>
          <label>Contraseña del supervisor<input type="text" minLength={8} value={form.supervisorPassword} onChange={(e) => setField('supervisorPassword', e.target.value)} required /></label>
          <button className="btn-primary" type="submit">Crear empresa y proceso</button>
        </form>
        {message ? <p className="success-message" role="status">{message}</p> : null}
        <div className="company-grid">
          {empresas.map((empresa) => <article key={empresa.id} className="report-card"><div><span className="readonly-badge">{empresa.estado}</span><h3>{empresa.razonSocial}</h3><p>RUC {empresa.ruc} · {empresa.contacto}</p><strong>{procesos.filter((item) => item.empresaId === empresa.id).length} proceso(s)</strong></div></article>)}
        </div>
      </section>
    </div>
  );
}

export default ConfiguracionPage;
