const TWILIO_VERIFY_BASE_URL = 'https://verify.twilio.com/v2';

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    return null;
  }

  return { accountSid, authToken, serviceSid };
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

export function maskPhoneForDisplay(phoneNumber) {
  const value = String(phoneNumber || '');

  if (value.length <= 7) {
    return value;
  }

  return `${value.slice(0, 4)}••••${value.slice(-3)}`;
}

async function twilioVerifyRequest(path, bodyParams) {
  const config = getTwilioConfig();

  if (!config) {
    const error = new Error('Phone verification provider is not configured.');
    error.status = 500;
    throw error;
  }

  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
  const body = new URLSearchParams(bodyParams);

  const response = await fetch(`${TWILIO_VERIFY_BASE_URL}/Services/${config.serviceSid}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result?.message || 'Phone verification request failed.');
    error.status = response.status;
    error.code = result?.code;
    error.moreInfo = result?.more_info;
    throw error;
  }

  return result;
}

export async function sendPhoneVerificationCode(to) {
  return twilioVerifyRequest('/Verifications', {
    To: to,
    Channel: 'sms',
  });
}

export async function checkPhoneVerificationCode(to, code) {
  return twilioVerifyRequest('/VerificationCheck', {
    To: to,
    Code: code,
  });
}
