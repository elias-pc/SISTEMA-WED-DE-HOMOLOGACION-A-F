import { useState, type FormEvent } from 'react';
import { demoUsers } from '../../services/auth';
import { api } from '../../services/api';
import { useTenant } from '../../src/tenant/TenantContext';
import type { Empresa, ProcesoHomologacion } from '../../types';

const initialForm = { razonSocial: '', ruc: '', nombreComercial: '', contacto: '', email: '', telefono: '', nombreProceso: '', codigo: '', fechaInicio: '', fechaLimite: '', ejecutivaId: '', clienteEmail: '', clientePassword: '', supervisorEmail: '', supervisorPassword: '' };

function ConfiguracionPage() {
  const { empresas, procesos, createEmpresaConProceso } = useTenant();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const ejecutivas = demoUsers.filter((item) => item.role === 'ejecutiva');
  const setField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (empresas.some((item) => item.ruc === form.ruc)) { setMessage('Ya existe una empresa con ese RUC.'); return; }
    const empresaId = `${form.nombreComercial.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const procesoId = `proc-${empresaId}`;
    const empresa: Empresa = { id: empresaId, razonSocial: form.razonSocial, ruc: form.ruc, nombreComercial: form.nombreComercial, contacto: form.contacto, email: form.email, telefono: form.telefono, estado: 'Activa' };
    const proceso: ProcesoHomologacion = { id: procesoId, empresaId, codigo: form.codigo, nombre: form.nombreProceso, fechaInicio: form.fechaInicio, fechaLimite: form.fechaLimite, estado: 'Planificación', ejecutivaId: form.ejecutivaId };
    try {
      await createEmpresaConProceso(empresa, proceso);
      await Promise.all([
        api.createUser({ id: `cliente-${empresaId}`, name: `Cliente ${form.nombreComercial}`, email: form.clienteEmail.trim().toLowerCase(), password: form.clientePassword, role: 'cliente', empresaIds: [empresaId] }),
        api.createUser({ id: `supervisor-${empresaId}`, name: `Supervisor ${form.nombreComercial}`, email: form.supervisorEmail.trim().toLowerCase(), password: form.supervisorPassword, role: 'supervisor_empresa', empresaIds: [empresaId] }),
      ]);
      setForm(initialForm);
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
          <label>Ejecutiva responsable<select value={form.ejecutivaId} onChange={(e) => setField('ejecutivaId', e.target.value)} required><option value="">Seleccionar</option>{ejecutivas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Fecha de inicio<input type="date" value={form.fechaInicio} onChange={(e) => setField('fechaInicio', e.target.value)} required /></label>
          <label>Fecha límite<input type="date" value={form.fechaLimite} onChange={(e) => setField('fechaLimite', e.target.value)} required /></label>
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
