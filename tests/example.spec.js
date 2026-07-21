// @ts-check
import { test, expect } from '@playwright/test';
import { isTrueFlag } from '../src/lib/booleanFlags.js';
import {
  buildAgeLabel,
  validateListingAgeAndDates,
} from '../src/lib/listingValidation.js';
import { formatPhoneForVerification } from '../src/lib/phoneVerification.js';
import { getSellerTrustSnapshot } from '../src/lib/sellerTrust.js';
import { getSeoRouteConfig } from '../src/lib/seoLandingConfig.js';

test.describe('phone verification regressions', () => {
  test('does not treat the text false as verified', () => {
    expect(isTrueFlag(false)).toBe(false);
    expect(isTrueFlag('false')).toBe(false);
    expect(isTrueFlag('0')).toBe(false);
    expect(isTrueFlag(true)).toBe(true);
    expect(isTrueFlag('true')).toBe(true);
  });

  test('normalizes Irish local numbers to canonical E.164', () => {
    expect(formatPhoneForVerification('+353', '085 240 0075')).toBe('+353852400075');
    expect(formatPhoneForVerification('+353', '+353 85 240 0075')).toBe('+353852400075');
  });
});

test.describe('seller trust regressions', () => {
  test('does not publish a self-declared breeder as verified', () => {
    expect(
      getSellerTrustSnapshot({
        account_type: 'Breeder',
        seller_verification_status: 'unverified',
        seller_verified_type: null,
      }),
    ).toEqual({
      sellerType: 'Private Seller',
      sellerVerified: false,
      sellerVerifiedAt: null,
    });
  });

  test('publishes only an admin-verified trusted seller type', () => {
    const verifiedAt = '2026-07-21T12:00:00.000Z';

    expect(
      getSellerTrustSnapshot({
        seller_verification_status: 'verified',
        seller_verified_type: 'Registered Breeder',
        seller_verified_at: verifiedAt,
      }),
    ).toEqual({
      sellerType: 'Registered Breeder',
      sellerVerified: true,
      sellerVerifiedAt: verifiedAt,
    });
  });
});

test.describe('listing age and date regressions', () => {
  test('builds a normalized age label', () => {
    expect(buildAgeLabel('1', 'weeks')).toBe('1 week');
    expect(buildAgeLabel('8', 'weeks')).toBe('8 weeks');
  });

  test('requires legal dates for an underage dog', () => {
    expect(
      validateListingAgeAndDates({
        animalType: 'Dogs',
        breed: 'Labrador Retriever',
        age: '1 week',
        dateOfBirth: null,
        readyToLeave: null,
        now: new Date('2026-07-21T12:00:00.000Z'),
      }),
    ).toContain('must include a date of birth');
  });

  test('rejects a ready-to-leave date before eight weeks', () => {
    expect(
      validateListingAgeAndDates({
        animalType: 'Dogs',
        breed: 'Labrador Retriever',
        age: '4 weeks',
        dateOfBirth: '2026-07-01',
        readyToLeave: '2026-07-20',
        now: new Date('2026-07-21T12:00:00.000Z'),
      }),
    ).toContain('Minimum age is 8 weeks');
  });

  test('accepts consistent adult animal dates', () => {
    expect(
      validateListingAgeAndDates({
        animalType: 'Dogs',
        breed: 'Labrador Retriever',
        age: '1 year',
        dateOfBirth: '2025-07-21',
        readyToLeave: '2025-09-15',
        now: new Date('2026-07-21T12:00:00.000Z'),
      }),
    ).toBe('');
  });
});

test.describe('SEO landing regressions', () => {
  test('marks puppy and kitten pages with youth filters', () => {
    expect(getSeoRouteConfig(['puppies-for-sale'])?.keyword).toBe('puppies');
    expect(getSeoRouteConfig(['kittens-for-sale'])?.keyword).toBe('kittens');
  });
});
