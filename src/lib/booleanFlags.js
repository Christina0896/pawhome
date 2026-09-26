export function isTrueFlag(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) return false;

  const normalized = String(value).trim().toLowerCase();

  return ['true', 't', '1', 'yes', 'y', 'on'].includes(normalized);
}

export function normalizePhoneVerified(profile) {
  if (!profile) return profile;

  return {
    ...profile,
    phone_verified: isTrueFlag(profile.phone_verified),
  };
}
