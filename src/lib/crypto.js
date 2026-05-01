import CryptoJS from 'crypto-js';

export const encrypt = (text, password) => {
  if (!text || !password) return '';
  return CryptoJS.AES.encrypt(text, password).toString();
};

export const decrypt = (cipherText, password) => {
  if (!cipherText || !password) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || '';
  } catch (e) {
    return '';
  }
};

export const encryptEntry = (entry, password) => {
  return {
    ...entry,
    encrypted_password: encrypt(entry.encrypted_password, password),
    username: encrypt(entry.username, password),
    notes: entry.notes ? encrypt(entry.notes, password) : '',
    platform: encrypt(entry.platform, password),
  };
};

export const decryptEntry = (entry, password) => {
  return {
    ...entry,
    encrypted_password: decrypt(entry.encrypted_password, password),
    username: decrypt(entry.username, password),
    notes: entry.notes ? decrypt(entry.notes, password) : '',
    platform: decrypt(entry.platform, password),
  };
};