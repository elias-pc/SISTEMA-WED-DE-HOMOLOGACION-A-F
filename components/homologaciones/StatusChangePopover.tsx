import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import type { AuthUser, CatalogoEstadoGrupo, CatalogoEstadoOpcion, ConfiguracionHomologacion, Proveedor, TransicionDisponible } from '../../types';

interface Props {
  providerId: string;
  providerName: string;
  anchor: { x: number; y: number };
  companyId: string;
  configuration: ConfiguracionHomologacion;
  onClose: () => void;
  onChanged: () => void;
}

const fieldLabels: Record<string, string> = {
  ejecutivaId: 'Ejecutiva asignada', inspectorId: 'Inspector asignado', motivo: 'Motivo', banco: 'Banco', monto: 'Importe', modalidad: 'Modalidad de pago', fechaPago: 'Fecha de pago', numeroOperacion: 'Nro. de operación', numeroFactura: 'Nro. de factura', formulario: 'Formulario enviado', documentosConformes: 'Documentos conformes', fechaVisita: 'Fecha y hora de visita', modalidadVisita: 'Modalidad de visita', informeVisita: 'Informe de visita', tipoDocumento: 'Tipo de documento', dictamen: 'Dictamen', puntaje: 'Puntaje', fechaEmision: 'Fecha de emisión', fechaVencimiento: 'Fecha de vencimiento', alcance: 'Alcance',
};

function inputType(field: string) {
  if (field.startsWith('fecha')) return 'date';
  if (field === 'monto' || field === 'puntaje') return 'number';
  return 'text';
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function StatusChangePopover({ providerId, providerName, anchor, companyId, configuration, onClose, onChanged }: Props) {
  const [workflow, setWorkflow] = useState<{ provider: Proveedor; transicionesDisponibles: TransicionDisponible[]; catalogoEstados?: CatalogoEstadoGrupo[] } | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<TransicionDisponible | null>(null);
  const [fields, setFields] = useState<Record<string, string | boolean>>({});
  const [moduleScores, setModuleScores] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState(() => ({
    top: Math.max(8, Math.min(anchor.y + 10, window.innerHeight - 430)),
    left: Math.max(8, Math.min(anchor.x - 140, window.innerWidth - 400)),
  }));

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await api.providerWorkflowDetail(providerId);
        if (!active) return;
        setWorkflow(data);
        if (data.transicionesDisponibles.some((transition) => transition.datosObligatorios.includes('ejecutivaId') || transition.datosObligatorios.includes('inspectorId'))) {
          const list = await api.users(companyId);
          if (active) setUsers(list.users);
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'No se pudo cargar el flujo del proveedor.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [providerId, companyId]);

  useEffect(() => {
    const closeWhenClickingOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !panelRef.current?.contains(event.target)) onClose();
    };
    const closeWithEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('pointerdown', closeWhenClickingOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeWhenClickingOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const place = () => {
      const margin = 8;
      const height = panel.offsetHeight;
      const width = panel.offsetWidth;
      const top = Math.max(margin, Math.min(anchor.y + 10, window.innerHeight - height - margin));
      const left = Math.max(margin, Math.min(anchor.x - 140, window.innerWidth - width - margin));
      setPlacement((current) => current.top === top && current.left === left ? current : { top, left });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [anchor.x, anchor.y, selectedTransition, workflow, loading, message]);

  const transitions = useMemo(() => new Map((workflow?.transicionesDisponibles || []).map((item) => [item.codigo, item])), [workflow]);
  const currentStatus = workflow?.provider.flujo?.estado;
  const currentSubstatus = workflow?.provider.flujo?.subestado;
  const currentSubstatusLabel = useMemo(() => {
    const match = (workflow?.catalogoEstados || []).flatMap((group) => group.substatuses).find((option) => option.substatus === currentSubstatus);
    return match?.label ?? (currentSubstatus ? currentSubstatus.replace(/_/g, ' ').toLowerCase() : '');
  }, [workflow, currentSubstatus]);
  const executives = useMemo(() => users.filter((user) => user.role === 'ejecutiva'), [users]);
  const inspectors = useMemo(() => users.filter((user) => user.role === 'inspector'), [users]);

  const pickOption = (option: CatalogoEstadoOpcion) => {
    const transition = option.transitionCodes.map((code) => transitions.get(code)).find(Boolean);
    if (!transition) return;
    setMessage('');
    setFields(Object.fromEntries(transition.datosObligatorios.map((field) => [field, field === 'documentosConformes' ? false : ''])));
    setModuleScores({});
    setSelectedTransition(transition);
  };

  const applyTransition = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!selectedTransition) return;
    setBusy(true); setMessage('');
    try {
      const datos: Record<string, unknown> = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, key === 'monto' || key === 'puntaje' ? Number(value) : value]));
      const documentType = configuration.documentTypes.find((item) => item.name === datos.tipoDocumento);
      if (documentType && typeof datos.fechaEmision === 'string') datos.fechaVencimiento = addDays(datos.fechaEmision, documentType.validityDays);
      if (selectedTransition.codigo === 'EMITIR_ENTREGABLE') {
        datos.modulos = configuration.evaluationModules.map((name) => ({ nombre: name, puntaje: moduleScores[name] === '' || moduleScores[name] === undefined ? null : Number(moduleScores[name]) }));
      }
      await api.applyProviderTransition(providerId, { transicion: selectedTransition.codigo, datos, motivo: typeof fields.motivo === 'string' ? fields.motivo : undefined, version: workflow?.provider.flujo?.version });
      onChanged();
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el status.');
    } finally {
      setBusy(false);
    }
  };

  const renderField = (field: string) => {
    const label = fieldLabels[field] || field;
    const value = fields[field];
    if (field === 'ejecutivaId' || field === 'inspectorId') {
      const options = field === 'ejecutivaId' ? executives : inspectors;
      return <label key={field}>{label}<select required value={String(value || '')} onChange={(event) => setFields((current) => ({ ...current, [field]: event.target.value }))}><option value="">Seleccionar</option>{options.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>;
    }
    if (field === 'documentosConformes') return <label key={field} className="checkbox-field"><input type="checkbox" checked={Boolean(value)} onChange={(event) => setFields((current) => ({ ...current, [field]: event.target.checked }))} /> {label}</label>;
    if (field === 'tipoDocumento') return <label key={field}>{label}<select required value={String(value || '')} onChange={(event) => setFields((current) => ({ ...current, [field]: event.target.value }))}><option value="">Seleccionar</option>{configuration.documentTypes.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>;
    if (field === 'dictamen') return <label key={field}>{label}<select required value={String(value || '')} onChange={(event) => setFields((current) => ({ ...current, [field]: event.target.value }))}><option value="">Seleccionar</option>{configuration.opinions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
    return <label key={field}>{label}<input required type={inputType(field)} step={field === 'monto' || field === 'puntaje' ? '0.01' : undefined} value={String(value || '')} onChange={(event) => setFields((current) => ({ ...current, [field]: event.target.value }))} /></label>;
  };

  const style = { top: `${placement.top}px`, left: `${placement.left}px` };

  return (
    <div className="status-popover" role="dialog" aria-modal="false" aria-labelledby="status-popover-title" ref={panelRef} style={style}>
      <header className="status-popover-header">
        <div>
          <h3 id="status-popover-title">Cambiar Status</h3>
          <p>{providerName}</p>
        </div>
        <button type="button" className="modal-close" aria-label="Cerrar ventana de status" onClick={onClose}>×</button>
      </header>
      <p className="status-popover-current">Status actual: <strong>{currentStatus === 'PENDIENTE_INSCRIPCION' ? 'Pendiente de inscripción' : currentStatus === 'INSCRITO' ? 'Inscrito' : currentStatus === 'HOMOLOGADO' ? 'Homologado' : 'Sin status'}</strong>{currentSubstatus ? <> · Sub-Status actual: <strong>{currentSubstatusLabel}</strong></> : null}</p>
      {message ? <p className="form-error" role="alert">{message}</p> : null}
      {!loading && transitions.size === 0 ? <p className="status-popover-hint">En esta etapa el cambio lo gestiona otra área del proceso (Inspecciones). Tu rol no tiene cambios disponibles.</p> : null}
      {selectedTransition ? null : loading ? <p className="secondary-text">Cargando status disponibles...</p> : (
        <div className="status-popover-body">
          {(workflow?.catalogoEstados || []).map((group) => (
            <section key={group.status} className="status-group">
              <h4>{group.label}</h4>
              <ul>
                {group.substatuses.map((option) => {
                  const available = option.transitionCodes.some((code) => transitions.has(code));
                  const isCurrent = option.substatus === currentSubstatus;
                  return (
                    <li key={option.substatus}>
                      <button type="button" className={`status-option${isCurrent ? ' current' : ''}${available ? '' : ' disabled'}`} disabled={!available || busy} title={available ? undefined : option.automatic ? 'Actualización automática del sistema.' : 'No disponible desde el estado actual.'} onClick={() => pickOption(option)}>
                        <span>{option.label}</span>
                        {isCurrent ? <small>Actual</small> : available ? null : <small>{option.automatic ? 'Automático' : 'No disponible'}</small>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
      {selectedTransition ? (
        <form className="status-popover-form" onSubmit={applyTransition}>
          <h4>{selectedTransition.etiqueta}</h4>
          {selectedTransition.datosObligatorios.map(renderField)}
          {selectedTransition.codigo === 'EMITIR_ENTREGABLE' ? <fieldset className="module-score-fields"><legend>Evaluación por módulos</legend>{configuration.evaluationModules.map((module) => <label key={module}>{module}<input type="number" min="0" max="100" step="0.01" value={moduleScores[module] || ''} onChange={(event) => setModuleScores((current) => ({ ...current, [module]: event.target.value }))} /></label>)}</fieldset> : null}
          <div className="status-popover-actions">
            <button type="button" className="btn-secondary" onClick={() => { setSelectedTransition(null); setMessage(''); }} disabled={busy}>Volver</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando...' : 'Confirmar cambio'}</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export default StatusChangePopover;
