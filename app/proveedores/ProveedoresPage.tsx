import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import ProveedoresTable from '../../components/proveedores/ProveedoresTable';
import ProviderWorkbench from '../../components/proveedores/ProviderWorkbench';
import { useAuth } from '../../src/auth/AuthContext';
import { useProveedores } from '../../src/providers/ProveedoresContext';
import type { ImportPreview, Proveedor } from '../../types';
import { useTenant } from '../../src/tenant/TenantContext';
import { api } from '../../services/api';

const emptyForm = { ruc: '', razonSocial: '', personaContacto: '', telefonos: '', email: '', direccion: '', departamento: '', distrito: '', actividadPrincipal: '' };

function ProveedoresPage() {
  const { user } = useAuth();
  const { proveedores, addProveedor, refresh, replaceProveedor } = useProveedores();
  const { selectedEmpresa, selectedProceso } = useTenant();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Proveedor | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const canEdit = user?.role === 'administradora' || user?.role === 'supervisor_general';

  const proveedoresFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return proveedores;
    return proveedores.filter((proveedor) => proveedor.razonSocial.toLowerCase().includes(term) || proveedor.ruc.includes(term) || proveedor.distrito.toLowerCase().includes(term));
  }, [proveedores, search]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit || !selectedEmpresa || !selectedProceso) return;
    if (proveedores.some((item) => item.ruc === form.ruc)) {
      setMessage('Ya existe un proveedor registrado con ese RUC.');
      return;
    }
    try {
      await addProveedor({ ...form, id: crypto.randomUUID(), empresaId: selectedEmpresa.id, procesoId: selectedProceso.id, estado: 'En proceso', estadoEjecutiva: 'Contactado', calificacion: 0, fechaRegistro: new Date().toLocaleDateString('es-PE'), vigencia: 'N/A' });
      setForm(emptyForm); setShowForm(false); setMessage('Proveedor registrado correctamente.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo registrar el proveedor.'); }
  };

  const asBase64 = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error('No se pudo leer el archivo.')); reader.onload = () => resolve(String(reader.result).split(',')[1] || ''); reader.readAsDataURL(file); });
  const previewImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null; setImportFile(file); setImportPreview(null); if (!file || !selectedEmpresa || !selectedProceso) return;
    setImportBusy(true); setMessage('');
    try { setImportPreview(await api.previewProviderImport({ empresaId: selectedEmpresa.id, procesoId: selectedProceso.id, fileName: file.name, contentBase64: await asBase64(file) })); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo validar el Excel.'); }
    finally { setImportBusy(false); }
  };
  const confirmImport = async () => {
    if (!importFile || !selectedEmpresa || !selectedProceso) return; setImportBusy(true); setMessage('');
    try { const result = await api.importProviders({ empresaId: selectedEmpresa.id, procesoId: selectedProceso.id, fileName: importFile.name, contentBase64: await asBase64(importFile) }); await refresh(); setImportPreview(null); setImportFile(null); setMessage(`Importación terminada: ${result.summary.readyRows} filas incorporadas y ${result.summary.rejectedRows} rechazadas.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo importar el Excel.'); }
    finally { setImportBusy(false); }
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
          {canEdit && selectedProceso ? <div className="provider-actions"><button type="button" className="btn-secondary" onClick={() => document.getElementById('provider-import')?.click()}>Importar Excel</button><input id="provider-import" className="visually-hidden" type="file" accept=".xlsx,.xls" onChange={previewImport} /><button type="button" className="btn-primary" onClick={() => setShowForm((visible) => !visible)}>{showForm ? 'Cancelar' : '+ Nuevo proveedor'}</button></div> : <span className="readonly-badge">{canEdit ? 'Selecciona un proceso' : 'Solo lectura'}</span>}
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
        {importPreview ? <section className="import-preview"><h3>Vista previa: {importFile?.name}</h3><p><strong>{importPreview.summary.readyRows}</strong> filas listas · <strong>{importPreview.summary.rejectedRows}</strong> rechazadas de {importPreview.summary.totalRows}.</p>{importPreview.summary.readyRows ? <button type="button" className="btn-primary" onClick={confirmImport} disabled={importBusy}>Confirmar importación</button> : null}<ul>{importPreview.rows.filter((row) => row.errors.length).slice(0, 8).map((row) => <li key={row.rowNumber}>Fila {row.rowNumber}: {row.errors.join(' ')}</li>)}</ul></section> : null}
        <input className="search-input" type="search" placeholder="Buscar proveedor, RUC o distrito..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <ProveedoresTable proveedores={proveedoresFiltrados} onSelect={setSelectedProvider} />
      </section>
      {selectedProvider && selectedEmpresa ? <ProviderWorkbench provider={selectedProvider} companyId={selectedEmpresa.id} onChanged={(provider) => { replaceProveedor(provider); setSelectedProvider(provider); }} onClose={() => setSelectedProvider(null)} /> : null}
    </div>
  );
}

export default ProveedoresPage;
