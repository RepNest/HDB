import fs from 'fs';
import path from 'path';

type EncryptionConfig = {
  encryption: {
    aesKey: string;
    iv: string;
  };
};

export function loadEncryptionConfig(): { key: Buffer; iv: Buffer } {
  const configPath = path.resolve(__dirname, '../../secure-config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error('secure-config.json not found.');
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(raw) as EncryptionConfig;

  return {
    key: Buffer.from(config.encryption.aesKey, 'base64'),
    iv: Buffer.from(config.encryption.iv, 'base64'),
  };
}
