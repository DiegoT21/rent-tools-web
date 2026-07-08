import { api } from './api';

export type PresignedUpload = {
  uploadUrl: string;
  fileKey: string;
  method: 'PUT' | 'POST';
  fields: Record<string, string> | null;
  publicUrl: string;
};

type UploadPurpose = 'catalog' | 'avatar' | 'evidence';

const useBackendUpload =
  import.meta.env.VITE_USE_BACKEND_UPLOAD === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_USE_BACKEND_UPLOAD !== 'false');

function buildPostForm(fields: Record<string, string>, file: File): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append('file', file);
  return form;
}

async function postToS3(
  uploadUrl: string,
  fields: Record<string, string>,
  file: File,
): Promise<void> {
  let url = uploadUrl;

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      body: buildPostForm(fields, file),
      redirect: 'manual',
    });

    if ([301, 302, 307, 308].includes(res.status)) {
      const location = res.headers.get('Location');
      if (location) {
        url = new URL(location, url).href;
        continue;
      }
    }

    if (res.status === 204 || res.ok) return;

    const body = await res.text().catch(() => '');
    throw new Error(`Falló la subida a S3 (POST) (HTTP ${res.status}) ${body}`.trim());
  }

  throw new Error('Falló la subida a S3: demasiados redirects regionales');
}

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

  const publicUrl =
    data?.publicUrl ??
    `${(
      (import.meta as any).env?.VITE_MEDIA_PUBLIC_BASE_URL ||
      (import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL ||
      'https://renttools-inventario-publico.s3.us-east-2.amazonaws.com'
    ).replace(/\/+$/, '')}/${String(fileKey).replace(/^\/+/, '')}`;

  return {
    uploadUrl: String(uploadUrl),
    fileKey: String(fileKey),
    method,
    fields,
    publicUrl,
  };
}

export async function uploadViaBackend(
  file: File,
  isPrivate: boolean,
  purpose?: UploadPurpose,
): Promise<{ fileKey: string; publicUrl: string | null }> {
  const form = new FormData();
  form.append('file', file);
  form.append('isPrivate', String(isPrivate));
  if (purpose) form.append('purpose', purpose);

  const response = await api.post('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const fileKey = response.data?.data?.fileKey ?? response.data?.fileKey;
  const publicUrl = response.data?.data?.publicUrl ?? response.data?.publicUrl ?? null;
  if (!fileKey) {
    throw new Error('Respuesta inválida de /media/upload (falta fileKey).');
  }

  return { fileKey: String(fileKey), publicUrl: publicUrl ? String(publicUrl) : null };
}

export async function uploadToPresignedUrl(
  signed: PresignedUpload,
  file: File,
): Promise<void> {
  if (signed.method === 'POST' && signed.fields) {
    await postToS3(signed.uploadUrl, signed.fields, file);
    return;
  }

  const res = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
    redirect: 'manual',
  });

  if (!res.ok && ![301, 302, 307, 308].includes(res.status)) {
    const body = await res.text().catch(() => '');
    throw new Error(`Falló la subida a S3 (PUT) (HTTP ${res.status}) ${body}`.trim());
  }

  if ([301, 302, 307, 308].includes(res.status)) {
    const location = res.headers.get('Location');
    if (location) {
      const retry = await fetch(location, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });
      if (!retry.ok) {
        const body = await retry.text().catch(() => '');
        throw new Error(`Falló la subida a S3 (PUT redirect) (HTTP ${retry.status}) ${body}`.trim());
      }
    }
  }
}

export async function uploadFileToStorage(
  file: File,
  isPrivate: boolean,
  purpose?: UploadPurpose,
): Promise<string> {
  if (useBackendUpload) {
    const uploaded = await uploadViaBackend(file, isPrivate, purpose);
    return uploaded.fileKey;
  }

  const signed = await getUploadUrlAndKey(file, isPrivate, purpose);
  await uploadToPresignedUrl(signed, file);
  return signed.fileKey;
}

export async function uploadAvatar(file: File): Promise<string> {
  return uploadFileToStorage(file, false, 'avatar');
}

export async function uploadFileToStorageWithUrl(
  file: File,
  isPrivate: boolean,
  purpose?: UploadPurpose,
): Promise<{ fileKey: string; publicUrl: string }> {
  if (useBackendUpload) {
    const uploaded = await uploadViaBackend(file, isPrivate, purpose);
    return {
      fileKey: uploaded.fileKey,
      publicUrl:
        uploaded.publicUrl ??
        `${(
          (import.meta as any).env?.VITE_MEDIA_PUBLIC_BASE_URL ||
          (import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL ||
          'https://renttools-inventario-publico.s3.us-east-2.amazonaws.com'
        ).replace(/\/+$/, '')}/${String(uploaded.fileKey).replace(/^\/+/, '')}`,
    };
  }

  const signed = await getUploadUrlAndKey(file, isPrivate, purpose);
  await uploadToPresignedUrl(signed, file);
  return { fileKey: signed.fileKey, publicUrl: signed.publicUrl };
}
