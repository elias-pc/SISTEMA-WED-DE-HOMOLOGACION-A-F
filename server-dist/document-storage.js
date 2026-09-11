import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
function safeFileName(name) {
    const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
    return base || 'documento';
}
function localRoot() {
    return path.resolve(process.cwd(), config.documentStoragePath);
}
export async function storeLocalDocument(providerId, originalName, contentBase64) {
    if (config.documentStorageDriver !== 'local')
        throw new Error('El almacenamiento configurado no admite archivos locales.');
    const content = Buffer.from(contentBase64, 'base64');
    if (!content.length || content.length > MAX_DOCUMENT_BYTES)
        throw new Error('El documento debe pesar entre 1 byte y 5 MB.');
    const storageKey = `${providerId}/${randomUUID()}-${safeFileName(originalName)}`;
    const absolutePath = path.join(localRoot(), storageKey);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, { flag: 'wx' });
    return { storageDriver: 'local', storageKey, byteSize: content.length };
}
export async function readLocalDocument(storageKey) {
    const root = localRoot();
    const absolutePath = path.resolve(root, storageKey);
    if (!absolutePath.startsWith(`${root}${path.sep}`))
        throw new Error('Ruta documental no válida.');
    return readFile(absolutePath);
}
export { MAX_DOCUMENT_BYTES };
