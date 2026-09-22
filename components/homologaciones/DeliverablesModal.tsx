import { useMemo, useState } from 'react';
import type { DocumentoEntregable } from '../../types';

interface Props {
  providerId: string;
  providerName: string;
  documents: DocumentoEntregable[];
  onClose: () => void;
}

function documentUrl(providerId: string, documentId: string) {
  return `/api/providers/${encodeURIComponent(providerId)}/documents/${encodeURIComponent(documentId)}/content`;
}

function formatBytes(byteSize: number) {
  if (byteSize < 1024) return `${byteSize} B`;
  return `${Math.ceil(byteSize / 1024)} KB`;
}

function DeliverablesModal({ providerId, providerName, documents, onClose }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(documents[0]?.id ?? null);
  const [message, setMessage] = useState('');
  const previewDocument = useMemo(() => documents.find((document) => document.id === previewId) ?? null, [documents, previewId]);
  const selectedDocuments = useMemo(() => documents.filter((document) => selectedIds.includes(document.id)), [documents, selectedIds]);

  const toggleDocument = (documentId: string) => {
    setSelectedIds((current) => current.includes(documentId) ? current.filter((id) => id !== documentId) : [...current, documentId]);
  };

  const downloadSelected = () => {
    if (!selectedDocuments.length) return;
    selectedDocuments.forEach((document) => {
      const link = window.document.createElement('a');
      link.href = documentUrl(providerId, document.id);
      link.download = document.originalName;
      window.document.body.append(link);
      link.click();
      link.remove();
    });
    setMessage(`Se iniciaron ${selectedDocuments.length} descarga(s).`);
  };

  const renderPreview = () => {
    if (!previewDocument) return <p className="document-preview-empty">Selecciona un documento para previsualizarlo.</p>;
    const url = documentUrl(providerId, previewDocument.id);
    if (previewDocument.mimeType.startsWith('image/')) return <img className="deliverable-preview-image" src={url} alt={`Vista previa de ${previewDocument.originalName}`} />;
    if (previewDocument.mimeType === 'application/pdf' || previewDocument.mimeType.startsWith('text/')) return <iframe className="deliverable-preview-frame" src={url} title={`Vista previa de ${previewDocument.originalName}`} />;
    return <div className="document-preview-empty"><p>Este tipo de archivo no admite vista previa integrada.</p><a className="btn-secondary" href={url} target="_blank" rel="noreferrer">Abrir documento</a></div>;
  };

  return (
    <div className="deliverables-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="deliverables-modal" role="dialog" aria-modal="true" aria-labelledby="deliverables-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="deliverables-modal-header">
          <div><h3 id="deliverables-title">Entregables del proveedor</h3><p>{providerName}</p></div>
          <button type="button" className="modal-close" aria-label="Cerrar entregables" onClick={onClose}>×</button>
        </header>
        <div className="deliverables-modal-content">
          <aside className="deliverables-list" aria-label="Lista de entregables">
            <div className="deliverables-list-actions">
              <span>{selectedDocuments.length} seleccionado(s)</span>
              <button type="button" onClick={() => setSelectedIds(documents.map((document) => document.id))}>Seleccionar todos</button>
              <button type="button" onClick={() => setSelectedIds([])}>Limpiar</button>
            </div>
            {documents.map((document) => (
              <div className={`deliverable-item${previewDocument?.id === document.id ? ' active' : ''}`} key={document.id}>
                <label><input type="checkbox" checked={selectedIds.includes(document.id)} onChange={() => toggleDocument(document.id)} /><span><strong>{document.originalName}</strong><small>{document.mimeType} · {formatBytes(document.byteSize)}</small></span></label>
                <button type="button" onClick={() => setPreviewId(document.id)}>Vista previa</button>
              </div>
            ))}
          </aside>
          <div className="deliverable-preview" aria-live="polite">{renderPreview()}</div>
        </div>
        <footer className="deliverables-modal-footer">
          <p role="status">{message}</p>
          <div><button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button><button type="button" className="btn-primary" onClick={downloadSelected} disabled={!selectedDocuments.length}>Descargar seleccionados</button></div>
        </footer>
      </section>
    </div>
  );
}

export default DeliverablesModal;
