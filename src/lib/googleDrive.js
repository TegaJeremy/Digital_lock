const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const FILE_NAME = 'tjeremy_vault_backup.json';

let tokenClient = null;
let accessToken = null;

export const initGoogleDrive = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: () => {},
      });
      resolve();
    };
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
};

export const connectGoogleDrive = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Drive not initialized'));
      return;
    }
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(response);
        return;
      }
      accessToken = response.access_token;
      localStorage.setItem('tj_drive_connected', 'true');
      resolve(accessToken);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const silentConnect = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) { reject(); return; }
    tokenClient.callback = (response) => {
      if (response.error) { reject(response); return; }
      accessToken = response.access_token;
      localStorage.setItem('tj_drive_connected', 'true');
      resolve(accessToken);
    };
    tokenClient.requestAccessToken({ prompt: '' });
  });
};

export const ensureConnected = async () => {
  if (accessToken) return true;
  try {
    await connectGoogleDrive();
    return true;
  } catch (e) {
    return false;
  }
};

export const isConnected = () => !!accessToken;

const getHeaders = () => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

const findBackupFile = async () => {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'`,
    { headers: getHeaders() }
  );
  const data = await res.json();
  return data.files?.[0] || null;
};

export const readBackup = async () => {
  try {
    const file = await findBackupFile();
    if (!file) return null;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      { headers: getHeaders() }
    );
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Failed to read backup:', e);
    return null;
  }
};

export const writeBackup = async (entries) => {
  if (!accessToken) return;
  try {
    const existing = await findBackupFile();
    const body = JSON.stringify({
      backup_date: new Date().toISOString(),
      entries,
    });
    if (existing) {
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}` },
          body,
        }
      );
    } else {
      const metadata = { name: FILE_NAME, parents: ['appDataFolder'] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([body], { type: 'application/json' }));
      await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        }
      );
    }
  } catch (e) {
    console.error('Failed to write backup:', e);
  }
};

export const deleteFromBackup = async (entryId) => {
  if (!accessToken) return;
  try {
    const current = await readBackup();
    if (!current) return;
    const updated = {
      ...current,
      entries: current.entries.filter((e) => e.id !== entryId),
    };
    await writeBackup(updated.entries);
  } catch (e) {
    console.error('Failed to delete from backup:', e);
  }
};