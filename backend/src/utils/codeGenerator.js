import crypto from 'crypto';

export const generateUniqueCode = () => {
  return `qs-${crypto.randomBytes(4).toString('hex')}`;
};
