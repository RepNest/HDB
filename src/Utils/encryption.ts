import crypto from 'crypto';
import { loadEncryptionConfig } from './loadEncryptionCOnfig';

const { key, iv } = loadEncryptionConfig();

export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf-8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

export function decrypt(encrypted: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'base64', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}
