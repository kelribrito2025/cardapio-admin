// Storage helpers usando S3 próprio do usuário (Mindi)
// Substitui o storage do Manus Forge por bucket S3 configurado pelo usuário

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ENV } from './_core/env';

// Configuração do cliente S3
function getS3Client(): S3Client {
  if (!ENV.mindiS3Bucket || !ENV.mindiS3AccessKey || !ENV.mindiS3SecretKey) {
    throw new Error(
      "S3 credentials missing: set MINDI_S3_BUCKET, MINDI_S3_ACCESS_KEY, and MINDI_S3_SECRET_KEY"
    );
  }

  return new S3Client({
    region: ENV.mindiS3Region || 'us-east-1',
    credentials: {
      accessKeyId: ENV.mindiS3AccessKey,
      secretAccessKey: ENV.mindiS3SecretKey,
    },
  });
}

// Normaliza a chave do arquivo (remove barras iniciais)
function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

// Gera URL pública do arquivo no S3
function getPublicUrl(key: string): string {
  const bucket = ENV.mindiS3Bucket;
  const region = ENV.mindiS3Region || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Upload de arquivo para o S3 próprio
 * @param relKey - Caminho relativo do arquivo (ex: "products/123/image.jpg")
 * @param data - Conteúdo do arquivo (Buffer, Uint8Array ou string)
 * @param contentType - Tipo MIME do arquivo (ex: "image/jpeg")
 * @returns Objeto com key e url pública do arquivo
 */
export async function mindiStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const s3Client = getS3Client();
  const key = normalizeKey(relKey);

  // Converter string para Buffer se necessário
  const body = typeof data === 'string' ? Buffer.from(data) : data;

  // Determinar Cache-Control baseado no tipo de conteúdo
  // Imagens: cache longo (1 ano) pois usamos nomes únicos com hash
  // Outros: cache moderado (1 dia)
  const isImage = contentType.startsWith("image/");
  const cacheControl = isImage
    ? "public, max-age=31536000, immutable"
    : "public, max-age=86400";

  const command = new PutObjectCommand({
    Bucket: ENV.mindiS3Bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: cacheControl,
  });

  await s3Client.send(command);

  const url = getPublicUrl(key);
  return { key, url };
}

/**
 * Obtém a URL pública de um arquivo no S3
 * @param relKey - Caminho relativo do arquivo
 * @returns Objeto com key e url pública do arquivo
 */
export async function mindiStorageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return {
    key,
    url: getPublicUrl(key),
  };
}

/**
 * Remove um arquivo do S3
 * @param relKey - Caminho relativo do arquivo
 */
export async function mindiStorageDelete(relKey: string): Promise<void> {
  const s3Client = getS3Client();
  const key = normalizeKey(relKey);

  const command = new DeleteObjectCommand({
    Bucket: ENV.mindiS3Bucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Verifica se as credenciais do S3 estão configuradas
 */
export function isMindiStorageConfigured(): boolean {
  return !!(ENV.mindiS3Bucket && ENV.mindiS3AccessKey && ENV.mindiS3SecretKey);
}
