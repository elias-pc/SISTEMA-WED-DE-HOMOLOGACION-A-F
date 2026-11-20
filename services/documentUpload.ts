import { api } from './api';

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.readAsDataURL(file);
  });
}

/** Sube un documento al proveedor: directo al almacenamiento seguro (Neon) o por el servidor si no está configurado. */
export async function uploadProviderDocument(providerId: string, file: File, category = 'Entregable') {
  const metadata = { category, originalName: file.name, mimeType: file.type || 'application/octet-stream' };
  const prepared = await api.prepareProviderDocument(providerId, { ...metadata, byteSize: file.size });
  if (prepared.mode === 'server') {
    await api.providerDocument(providerId, { ...metadata, contentBase64: await toBase64(file) });
    return;
  }
  const form = new FormData();
  Object.entries(prepared.upload.fields).forEach(([key, value]) => form.append(key, value));
  form.append('file', file);
  const upload = await fetch(prepared.upload.url, { method: 'POST', body: form });
  if (!upload.ok) throw new Error('No se pudo cargar el archivo en el almacenamiento seguro.');
  await api.completeProviderDocument(providerId, { ...metadata, documentId: prepared.documentId, storageKey: prepared.storageKey });
}
