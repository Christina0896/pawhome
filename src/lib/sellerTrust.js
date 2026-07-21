const VERIFIED_SELLER_TYPES = ['Registered Breeder', 'Shelter / Rescue'];

export function getSellerTrustSnapshot(profile) {
  const status = String(profile?.seller_verification_status || '').trim().toLowerCase();
  const verifiedType = String(profile?.seller_verified_type || '').trim();
  const verified = status === 'verified' && VERIFIED_SELLER_TYPES.includes(verifiedType);

  return {
    sellerType: verified ? verifiedType : 'Private Seller',
    sellerVerified: verified,
    sellerVerifiedAt: verified ? profile?.seller_verified_at || null : null,
  };
}

export function isVerifiedSellerType(value) {
  return VERIFIED_SELLER_TYPES.includes(String(value || '').trim());
}

export { VERIFIED_SELLER_TYPES };
