import { api } from './api';

export type PresignedUpload = {
  uploadUrl: string;
  fileKey: string;
  method: 'PUT' | 'POST';
  fields: Record<string, string> | null;
};

type UploadPurpose = 'catalog' | 'avatar' | 'evidence';

export async function getUploadUrlAndKey(
  file: File,
  isPrivate: boolean,
  purpose?: UploadPurpose,
): Promise<PresignedUpload> {
  const response = await api.post('/media/upload-url', {
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    isPrivate,
    ...(purpose ? { purpose } : {}),
  });

  const data = (response as any).data?.data ?? (response as any).data;
  const uploadUrl = data?.uploadUrl ?? data?.url ?? data?.signedUrl;
  const fileKey = data?.fileKey ?? data?.key;
  const method = (data?.method ?? (data?.fields ? 'POST' : 'PUT')) as 'PUT' | 'POST';
  const fields = (data?.fields ?? null) as Record<string, string> | null;

  if (!uploadUrl || !fileKey) {
    throw new Error('Respuesta inválida de /media/upload-url (faltan uploadUrl o fileKey).');
  }

  return {
    uploadUrl: String(uploadUrl),
    fileKey: String(fileKey),
    method,
    fields,
  };
}

export async function uploadToPresignedUrl(
  signed: PresignedUpload,
  file: File,
): Promise<void> {
  if (signed.method === 'POST' && signed.fields) {
    const form = new FormData();
    for (const [k, v] of Object.entries(signed.fields)) form.append(k, v);
    form.append('file', file);

    const res = await fetch(signed.uploadUrl, { method: 'POST', body: form });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Falló la subida a S3 (POST) (HTTP ${res.status}) ${body}`.trim());
    }
    return;
  }

  const res = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Falló la subida a S3 (PUT) (HTTP ${res.status}) ${body}`.trim());
  }
}

export async function uploadAvatar(file: File): Promise<string> {
  const signed = await getUploadUrlAndKey(file, false, 'avatar');
  await uploadToPresignedUrl(signed, file);
  return signed.fileKey;
}
