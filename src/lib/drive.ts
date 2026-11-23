// src/lib/drive.ts
import { getAccessToken } from './firebase.ts';

export async function fetchDriveFiles() {
  const token = getAccessToken();
  if (!token) throw new Error('Authorization required');

  const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,webViewLink,iconLink)', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
}
