import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { config } from './config.js';
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const NEON_DRIVER = 'neon-s3';
function safeFileName(name) {
    const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
    return base || 'documento';
}
function localRoot() {
    return path.resolve(process.cwd(), config.documentStoragePath);
}
function validateContent(content) {
    validateByteSize(content.length);
}
function validateByteSize(byteSize) {
    if (!Number.isInteger(byteSize) || byteSize < 1 || byteSize > MAX_DOCUMENT_BYTES)
        throw new Error('El documento debe pesar entre 1 byte y 5 MB.');
}
function createStorageKey(providerId, documentId, originalName) {
    return `providers/${providerId}/${documentId}-${safeFileName(originalName)}`;
}
function neonBucket() {
    if (!config.documentStorageBucket)
        throw new Error('Falta configurar NEON_STORAGE_BUCKET para los entregables.');
    return config.documentStorageBucket;
}
function neonS3() {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, AWS_REGION } = process.env;
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_ENDPOINT_URL_S3 || !AWS_REGION) {
        throw new Error('Faltan las credenciales de Neon Object Storage.');
    }
    return new S3Client({
        region: AWS_REGION,
        endpoint: AWS_ENDPOINT_URL_S3,
        forcePathStyle: true,
        credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
    });
}
async function writeLocalDocument(providerId, documentId, originalName, content) {
    const storageKey = `${providerId}/${documentId}-${safeFileName(originalName)}`;
    const absolutePath = path.join(localRoot(), storageKey);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, { flag: 'wx' });
    return { storageDriver: 'local', storageKey, byteSize: content.length };
}
async function readLocalDocument(storageKey) {
    const root = localRoot();
    const absolutePath = path.resolve(root, storageKey);
    if (!absolutePath.startsWith(`${root}${path.sep}`))
        throw new Error('Ruta documental no válida.');
    return readFile(absolutePath);
}
export async function storeDocument(providerId, originalName, mimeType, contentBase64) {
    const content = Buffer.from(contentBase64, 'base64');
    validateContent(content);
    const documentId = randomUUID();
    if (config.documentStorageDriver === NEON_DRIVER) {
        const storageKey = createStorageKey(providerId, documentId, originalName);
        await neonS3().send(new PutObjectCommand({ Bucket: neonBucket(), Key: storageKey, Body: content, ContentType: mimeType }));
        return { storageDriver: NEON_DRIVER, storageKey, byteSize: content.length };
    }
    if (config.isProduction)
        throw new Error('La producción requiere Neon Object Storage para guardar entregables.');
    return writeLocalDocument(providerId, documentId, originalName, content);
}
export async function createDocumentUpload(providerId, originalName, mimeType, byteSize) {
    if (config.documentStorageDriver !== NEON_DRIVER)
        return null;
    validateByteSize(byteSize);
    const documentId = randomUUID();
    const storageKey = createStorageKey(providerId, documentId, originalName);
    const upload = await createPresignedPost(neonS3(), {
        Bucket: neonBucket(), Key: storageKey, Expires: 600,
        Fields: { 'Content-Type': mimeType },
        Conditions: [['content-length-range', 1, MAX_DOCUMENT_BYTES], ['eq', '$Content-Type', mimeType]],
    });
    return { documentId, storageKey, storageDriver: 'neon-s3', upload };
}
export async function confirmDocumentUpload(storageKey) {
    const result = await neonS3().send(new HeadObjectCommand({ Bucket: neonBucket(), Key: storageKey }));
    const byteSize = Number(result.ContentLength || 0);
    validateByteSize(byteSize);
    return { byteSize, mimeType: result.ContentType || 'application/octet-stream' };
}
export async function readDocument(storageDriver, storageKey) {
    if (storageDriver === 'local')
        return readLocalDocument(storageKey);
    if (storageDriver !== NEON_DRIVER)
        throw new Error('Controlador documental no compatible.');
    const result = await neonS3().send(new GetObjectCommand({ Bucket: neonBucket(), Key: storageKey }));
    if (!result.Body)
        throw new Error('El archivo no está disponible.');
    return Buffer.from(await result.Body.transformToByteArray());
}
export async function storeLocalDocument(providerId, originalName, contentBase64) {
    const content = Buffer.from(contentBase64, 'base64');
    validateContent(content);
    return writeLocalDocument(providerId, randomUUID(), originalName, content);
}
export { MAX_DOCUMENT_BYTES, readLocalDocument };
