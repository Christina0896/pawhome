import { Buffer } from 'node:buffer';

const VONAGE_VERIFY_BASE_URL = 'https://api.nexmo.com/v2/verify';

function getVonageConfig() {
  const apiKey = process.env.VONAGE_API_KEY;
  const apiSecret = process.env.VONAGE_API_SECRET;
  const brandName = process.env.VONAGE_BRAND_NAME || 'PawHome';

  if (!apiKey || !apiSecret || !brandName) {
    return null;
  }

  return { apiKey, apiSecret, brandName: brandName.slice(0, 18) };
}

function cleanDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function formatPhoneForVerification(phoneCode, phoneNumber) {
  const rawPhoneNumber = String(phoneNumber || '').trim();
  const codeDigits = cleanDigits(phoneCode);

  if (!rawPhoneNumber || !codeDigits) {
    return null;
  }

  if (rawPhoneNumber.startsWith('+')) {
    const fullDigits = cleanDigits(rawPhoneNumber);
    return fullDigits.length >= 8 && fullDigits.length <= 15 ? `+${fullDigits}` : null;
  }

  let localNumber = cleanDigits(rawPhoneNumber);

  if (localNumber.startsWith('00')) {
    localNumber = localNumber.slice(2);
    return localNumber.length >= 8 && localNumber.length <= 15 ? `+${localNumber}` : null;
  }

  while (localNumber.startsWith('0')) {
    localNumber = localNumber.slice(1);
  }

  const e164Number = `+${codeDigits}${localNumber}`;
  const totalDigits = cleanDigits(e164Number).length;

  return totalDigits >= 8 && totalDigits <= 15 ? e164Number : null;
}

function formatPhoneForVonage(phoneNumber) {
  return cleanDigits(phoneNumber);
}

export function maskPhoneForDisplay(phoneNumber) {
  const value = String(phoneNumber || '');

  if (value.length <= 7) {
    return value;
  }

  return `${value.slice(0, 4)}••••${value.slice(-3)}`;
}

async function vonageVerifyRequest(path, bodyParams) {
  const config = getVonageConfig();

  if (!config) {
    const error = new Error('Phone verification provider is not configured.');
    error.status = 500;
    throw error;
  }

  const auth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64');

  const response = await fetch(`${VONAGE_VERIFY_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyParams),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result?.title || result?.detail || result?.message || 'Phone verification request failed.');
    error.status = response.status;
    error.code = result?.type || result?.error_code;
    throw error;
  }

  return result;
}

export async function sendPhoneVerificationCode(to) {
  const config = getVonageConfig();

  if (!config) {
    const error = new Error('Phone verification provider is not configured.');
    error.status = 500;
    throw error;
  }

  return vonageVerifyRequest('/', {
    brand: config.brandName,
    code_length: 4,
    workflow: [
      {
        channel: 'sms',
        to: formatPhoneForVonage(to),
      },
      {
        channel: 'voice',
        to: formatPhoneForVonage(to),
      },
    ],
  });
}

export async function checkPhoneVerificationCode(requestId, code) {
  return vonageVerifyRequest(`/${encodeURIComponent(requestId)}`, {
    code,
  });
}
