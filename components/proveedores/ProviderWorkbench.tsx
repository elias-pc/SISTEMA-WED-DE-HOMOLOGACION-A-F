import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ApiError, api } from '../../services/api';
import type { AuthUser, ExpedienteProveedor, HistorialFlujo, Proveedor, TransicionDisponible } from '../../types';

interface Props {
  provider: Proveedor;
  companyId: string;
  onChanged: (provider: Proveedor) => void;
  onClose: () => void;
}

const labels: Record<string, string> = {
  ejecutivaId: 'Ejecutiva asignada', inspectorId: 'Inspector asignado', motivo: 'Motivo', banco: 'Banco', monto: 'Monto', modalidad: 'Modalidad de pago', fechaPago: 'Fecha de pago', numeroOperacion: 'N.° de operación', numeroFactura: 'N.° de factura', formulario: 'Formulario enviado', documentosConformes: 'Documentos conformes', fechaVisita: 'Fecha y hora de visita', modalidadVisita: 'Modalidad de visita', informeVisita: 'Informe de visita', tipoDocumento: 'Tipo de documento', dictamen: 'Dictamen', puntaje: 'Puntaje', fechaEmision: 'Fecha de emisión', fechaVencimiento: 'Fecha de vencimiento', alcance: 'Alcance',
};

function printable(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function inputType(field: string) {
  if (field.startsWith('fecha')) return 'date';
  if (field === 'monto' || field === 'puntaje') return 'number';
  return 'text';
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.readAsDataURL(file);
  });
}

function ProviderWorkbench({ provider, companyId, onChanged, onClose }: Props) {
  const [workflow, setWorkflow] = useState<{ provider: Proveedor; transicionesDisponibles: TransicionDisponible[]; historial: HistorialFlujo[] } | null>(null);
  const [dossier, setDossier] = useState<ExpedienteProveedor | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<TransicionDisponible | null>(null);
  const [fields, setFields] = useState<Record<string, string | boolean>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [nextWorkflow, nextDossier] = await Promise.all([api.providerWorkflowDetail(provider.id), api.providerDossier(provider.id)]);
    setWorkflow(nextWorkflow); setDossier(nextDossier);
    const needsAssignee = nextWorkflow.transicionesDisponibles.some((transition) => transition.datosObligatorios.includes('ejecutivaId') || transition.datosObligatorios.includes('inspectorId'));
    setUsers(needsAssignee ? (await api.users(companyId)).users : []);
  };

  useEffect(() => { void load().catch((error) => setMessage(error instanceof Error ? error.message : 'No se pudo cargar el expediente.')); }, [provider.id, companyId]);

  const selectedUsers = useMemo(() => ({
    executives: users.filter((user) => user.role === 'ejecutiva'),
    inspectors: users.filter((user) => user.role === 'inspector'),
  }), [users]);

  const pickTransition = (transition: TransicionDisponible) => {
    setSelectedTransition(transition);
    setFields(Object.fromEntries(transition.datosObligatorios.map((field) => [field, field === 'documentosConformes' ? false : ''])));
    setMessage('');
  };

  const submitTransition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTransition || !workflow) return;
    setBusy(true); setMessage('');
    try {
      const datos = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, key === 'monto' || key === 'puntaje' ? Number(value) : value]));
      const result = await api.applyProviderTransition(provider.id, { transicion: selectedTransition.codigo, datos, motivo: typeof fields.motivo === 'string' ? fields.motivo : undefined, version: workflow.provider.flujo?.version });
      onChanged(result.provider); setSelectedTransition(null); await load(); setMessage('Transición registrada y agregada al expediente.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo registrar la transición.'); }
    finally { setBusy(false); }
  };

  const uploadDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy(true); setMessage('');
    try { await api.providerDocument(provider.id, { category: 'Expediente', originalName: file.name, mimeType: file.type || 'application/octet-stream', contentBase64: await toBase64(file) }); await load(); setMessage('Documento guardado localmente en el expediente.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo guardar el documento.'); }
    finally { setBusy(false); event.target.value = ''; }
  };

  const saveWhatsAppPreferences = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setMessage('');
    try { await api.updateContactPreferences(provider.id, { whatsappPhone: String(form.get('phone') || ''), whatsappOptIn: form.get('optIn') === 'on', whatsappOptInSource: String(form.get('source') || '') }); await load(); setMessage('Preferencia de WhatsApp registrada. La integración continúa desactivada.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo guardar la preferencia.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="card workbench" aria-label={`Expediente de ${provider.razonSocial}`}>
      <div className="section-heading"><div><p className="context-label">Expediente operativo</p><h3>{provider.razonSocial}</h3><p className="secondary-text">RUC {provider.ruc} · Paso {workflow?.provider.flujo?.paso ?? provider.flujo?.paso ?? '—'} · {workflow?.provider.flujo?.subestado ?? provider.flujo?.subestado ?? 'Sin estado'}</p></div><button className="btn-secondary" type="button" onClick={onClose}>Cerrar</button></div>
      {message ? <p className={message.includes('No se pudo') ? 'form-error' : 'success-message'} role="status">{message}</p> : null}
      <div className="workbench-grid">
        <section><h4>Acciones disponibles</h4><div className="transition-list">{workflow?.transicionesDisponibles.length ? workflow.transicionesDisponibles.map((transition) => <button key={transition.codigo} type="button" className="btn-secondary" onClick={() => pickTransition(transition)}>{transition.etiqueta}</button>) : <p className="secondary-text">No tienes transiciones disponibles en este estado.</p>}</div>
          {selectedTransition ? <form className="transition-form" onSubmit={submitTransition}><h4>{selectedTransition.etiqueta}</h4>{selectedTransition.datosObligatorios.map((field) => field === 'ejecutivaId' || field === 'inspectorId' ? <label key={field}>{labels[field]}<select required value={String(fields[field] || '')} onChange={(event) => setFields((current) => ({ ...current, [field]: event.target.value }))}><option value="">Seleccionar</option>{(field === 'ejecutivaId' ? selectedUsers.executives : selectedUsers.inspectors).map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select></label> : field === 'documentosConformes' ? <label key={field} className="checkbox-field"><input type="checkbox" checked={Boolean(fields[field])} onChange={(event) => setFields((current) => ({ ...current, [field]: event.target.checked }))} /> {labels[field]}</label> : <label key={field}>{labels[field] || field}<input required type={inputType(field)} step={field === 'monto' || field === 'puntaje' ? '0.01' : undefined} value={String(fields[field] || '')} onChange={(event) => setFields((current) => ({ ...current, [field]: event.target.value }))} /></label>)}<button className="btn-primary" disabled={busy}>Guardar transición</button></form> : null}
        </section>
        <section><h4>Expediente</h4><div className="dossier-list"><p><strong>Pagos:</strong> {dossier?.payments.length || 0}</p><p><strong>Formularios:</strong> {dossier?.forms.length || 0}</p><p><strong>Visitas:</strong> {dossier?.inspections.length || 0}</p><p><strong>Certificados:</strong> {dossier?.certificates.length || 0}</p></div><label className="upload-control">Agregar documento local<input type="file" onChange={uploadDocument} disabled={busy} /></label>{dossier?.documents.map((document) => <a className="document-link" key={document.id} href={`/api/providers/${provider.id}/documents/${document.id}/content`} target="_blank" rel="noreferrer">{document.original_name} · {Math.ceil(document.byte_size / 1024)} KB</a>)}</section>
        <section><h4>WhatsApp preparado</h4><p className="secondary-text">No se envían mensajes hasta configurar Meta y habilitar el proveedor.</p><form className="transition-form" onSubmit={saveWhatsAppPreferences}><label>Teléfono WhatsApp<input name="phone" defaultValue={dossier?.contactPreferences?.whatsapp_phone || ''} placeholder="51999888777" /></label><label>Origen del consentimiento<input name="source" defaultValue={dossier?.contactPreferences?.whatsapp_opt_in_source || ''} placeholder="Formulario firmado" /></label><label className="checkbox-field"><input name="optIn" type="checkbox" defaultChecked={Boolean(dossier?.contactPreferences?.whatsapp_opt_in)} /> Consentimiento para WhatsApp</label><button className="btn-secondary" disabled={busy}>Guardar preferencia</button></form><p className="secondary-text">Eventos preparados: {dossier?.notifications.length || 0}; no se han enviado a Meta.</p></section>
      </div>
      <details className="history-panel"><summary>Ver trazabilidad ({workflow?.historial.length || 0} cambios)</summary><div className="timeline">{workflow?.historial.map((item) => <p key={item.id}><strong>{item.transition_code.split('_').join(' ')}</strong> · {item.to_substatus.split('_').join(' ')} · {new Date(item.created_at).toLocaleString('es-PE')}</p>)}</div></details>
    </section>
  );
}

export default ProviderWorkbench;
