import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { uploadProviderDocument } from '../../services/documentUpload';
import type { DocumentoEntregable } from '../../types';

interface Props {
  providerId: string;
  providerName: string;
  providerRuc?: string;
  documents: DocumentoEntregable[];
  /** Solo las ejecutivas suben entregables; el resto solo ve y descarga. */
  canUpload?: boolean;
  onUploaded?: () => Promise<void> | void;
  onClose: () => void;
}

function documentUrl(providerId: string, documentId: string) {
  return `/api/providers/${encodeURIComponent(providerId)}/documents/${encodeURIComponent(documentId)}/content`;
}

function formatBytes(byteSize: number) {
  if (byteSize < 1024) return `${byteSize} B`;
  if (byteSize < 1024 * 1024) return `${Math.ceil(byteSize / 1024)} KB`;
  return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(document: DocumentoEntregable) {
  if (document.mimeType === 'application/pdf') return { label: 'PDF', name: 'PDF', color: '#d51b1f' };
  if (document.mimeType.startsWith('image/')) return { label: (document.originalName.split('.').pop() || 'IMG').slice(0, 4).toUpperCase(), name: 'Imagen', color: '#172d48' };
  const extension = document.originalName.includes('.') ? document.originalName.split('.').pop() || '' : '';
  return { label: (extension || 'DOC').slice(0, 4).toUpperCase(), name: 'Documento', color: '#475569' };
}

function DeliverablesModal({ providerId, providerName, providerRuc, documents, canUpload = false, onUploaded, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(documents[0]?.id ?? null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const selected = useMemo(() => documents.find((document) => document.id === selectedId) ?? documents[0] ?? null, [documents, selectedId]);

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true); setError(''); setMessage('');
    try {
      await uploadProviderDocument(providerId, file, 'Entregable');
      await onUploaded?.();
      setSelectedId(null);
      setMessage(`Entregable «${file.name}» subido correctamente.`);
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir el entregable.'); }
    finally { setUploading(false); }
  };

  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [onClose]);

  const downloadSelected = () => {
    if (!selected) return;
    const link = window.document.createElement('a');
    link.href = documentUrl(providerId, selected.id);
    link.download = selected.originalName;
    window.document.body.append(link);
    link.click();
    link.remove();
    setMessage(`Descarga iniciada: ${selected.originalName}`);
  };

  const renderPreview = () => {
    if (!selected) return <p className="document-preview-empty">{canUpload ? 'Todavía no hay entregables. Usa «Subir entregable» para cargar el primero.' : 'Todavía no hay entregables para este proveedor.'}</p>;
    const url = documentUrl(providerId, selected.id);
    if (selected.mimeType.startsWith('image/')) return <img className="deliverable-preview-image" src={url} alt={`Vista previa de ${selected.originalName}`} />;
    if (selected.mimeType === 'application/pdf' || selected.mimeType.startsWith('text/')) return <iframe key={selected.id} className="deliverable-preview-frame" src={url} title={`Vista previa de ${selected.originalName}`} />;
    return <div className="document-preview-empty"><p>Este tipo de archivo no tiene vista previa. Puedes descargarlo con el botón «Descargar documento».</p></div>;
  };

  return (
    <div className="deliverables-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="deliverables-modal" role="dialog" aria-modal="true" aria-labelledby="deliverables-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="deliverables-modal-header" style={{ background: '#172d48', color: '#fff', borderBottom: '3px solid #d51b1f' }}>
          <div><h3 id="deliverables-title">Entregables del proveedor</h3><p style={{ color: '#cbd5e1' }}>{providerName}{providerRuc ? ` · RUC ${providerRuc}` : ''}</p></div>
          <button type="button" className="modal-close" aria-label="Cerrar entregables" onClick={onClose} style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)', background: 'transparent' }}>×</button>
        </header>
        <div className="deliverables-modal-content">
          <aside className="deliverables-list" aria-label="Documentos disponibles">
            <p style={{ margin: '0 0 .4rem', color: 'var(--color-text-muted)', fontSize: '.75rem', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>Documentos disponibles ({documents.length})</p>
            {documents.map((document) => {
              const kind = fileKind(document);
              const active = selected?.id === document.id;
              return (
                <button
                  type="button"
                  key={document.id}
                  aria-pressed={active}
                  onClick={() => { setSelectedId(document.id); setMessage(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '.75rem', width: '100%', minHeight: '64px', marginTop: '.55rem', padding: '.7rem', border: active ? '2px solid #d51b1f' : '1px solid #dbe3ec', borderRadius: '.65rem', background: active ? '#fff5f5' : '#fff', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                >
                  <span aria-hidden="true" style={{ flex: '0 0 auto', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '.5rem', background: kind.color, color: '#fff', fontSize: '.7rem', fontWeight: 800 }}>{kind.label}</span>
                  <span style={{ minWidth: 0, display: 'grid', gap: '.2rem' }}>
                    <strong style={{ overflowWrap: 'anywhere', fontSize: '.86rem', color: '#111827' }}>{document.originalName}</strong>
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '.74rem' }}>{kind.name} · {formatBytes(document.byteSize)}</small>
                  </span>
                </button>
              );
            })}
          </aside>
          <div style={{ minWidth: 0, display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', padding: '.75rem 1rem', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
              <div style={{ minWidth: 0, display: 'grid', gap: '.1rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '.75rem' }}>Vista previa</span>
                <strong style={{ overflowWrap: 'anywhere', fontSize: '.9rem' }}>{selected?.originalName || 'Ningún documento seleccionado'}</strong>
              </div>
              <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
              {canUpload ? <><button type="button" className="btn-primary" onClick={() => fileInput.current?.click()} disabled={uploading} style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', whiteSpace: 'nowrap' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21V9" /><path d="m7 14 5-5 5 5" /><path d="M5 3h14" /></svg>{uploading ? 'Subiendo…' : 'Subir entregable'}</button><input ref={fileInput} type="file" className="visually-hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx" onChange={uploadFile} aria-label="Seleccionar entregable" /></> : null}
              <button type="button" className="btn-primary" onClick={downloadSelected} disabled={!selected} style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', whiteSpace: 'nowrap' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
                Descargar documento
              </button>
              </div>
            </div>
            <div className="deliverable-preview" aria-live="polite">{renderPreview()}</div>
          </div>
        </div>
        <footer className="deliverables-modal-footer">
          <p role="status" style={error ? { color: '#b91c1c' } : undefined}>{error || message}</p>
          <div><button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button></div>
        </footer>
      </section>
    </div>
  );
}

export default DeliverablesModal;
