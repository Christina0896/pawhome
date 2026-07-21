import test from 'node:test';
import assert from 'node:assert/strict';
import { isTrueFlag } from '../src/lib/booleanFlags.js';
import { buildAgeLabel, validateListingAgeAndDates } from '../src/lib/listingValidation.js';
import { formatPhoneForVerification } from '../src/lib/phoneVerification.js';
import { getSellerTrustSnapshot } from '../src/lib/sellerTrust.js';
import { getSeoRouteConfig } from '../src/lib/seoLandingConfig.js';

test('does not treat false text as a verified boolean', () => {
  assert.equal(isTrueFlag(false), false);
  assert.equal(isTrueFlag('false'), false);
  assert.equal(isTrueFlag('0'), false);
  assert.equal(isTrueFlag(true), true);
  assert.equal(isTrueFlag('true'), true);
});

test('normalizes Irish local phone numbers to canonical E.164', () => {
  assert.equal(formatPhoneForVerification('+353', '085 240 0075'), '+353852400075');
  assert.equal(formatPhoneForVerification('+353', '+353 85 240 0075'), '+353852400075');
});

test('does not publish a self-declared breeder as verified', () => {
  assert.deepEqual(
    getSellerTrustSnapshot({
      account_type: 'Breeder',
      seller_verification_status: 'unverified',
      seller_verified_type: null,
    }),
    {
      sellerType: 'Private Seller',
      sellerVerified: false,
      sellerVerifiedAt: null,
    },
  );
});

test('publishes only an admin-verified trusted seller type', () => {
  const verifiedAt = '2026-07-21T12:00:00.000Z';

  assert.deepEqual(
    getSellerTrustSnapshot({
      seller_verification_status: 'verified',
      seller_verified_type: 'Registered Breeder',
      seller_verified_at: verifiedAt,
    }),
    {
      sellerType: 'Registered Breeder',
      sellerVerified: true,
      sellerVerifiedAt: verifiedAt,
    },
  );
});

test('builds normalized age labels', () => {
  assert.equal(buildAgeLabel('1', 'weeks'), '1 week');
  assert.equal(buildAgeLabel('8', 'weeks'), '8 weeks');
});

test('requires legal dates for an underage dog', () => {
  const error = validateListingAgeAndDates({
    animalType: 'Dogs',
    breed: 'Labrador Retriever',
    age: '1 week',
    dateOfBirth: null,
    readyToLeave: null,
    now: new Date('2026-07-21T12:00:00.000Z'),
  });

  assert.match(error, /must include a date of birth/i);
});

test('rejects a ready-to-leave date before eight weeks', () => {
  const error = validateListingAgeAndDates({
    animalType: 'Dogs',
    breed: 'Labrador Retriever',
    age: '4 weeks',
    dateOfBirth: '2026-07-01',
    readyToLeave: '2026-07-20',
    now: new Date('2026-07-21T12:00:00.000Z'),
  });

  assert.match(error, /minimum age is 8 weeks/i);
});

test('accepts consistent adult animal dates', () => {
  const error = validateListingAgeAndDates({
    animalType: 'Dogs',
    breed: 'Labrador Retriever',
    age: '1 year',
    dateOfBirth: '2025-07-21',
    readyToLeave: '2025-09-15',
    now: new Date('2026-07-21T12:00:00.000Z'),
  });

  assert.equal(error, '');
});

test('marks puppy and kitten SEO routes with youth filters', () => {
  assert.equal(getSeoRouteConfig(['puppies-for-sale'])?.keyword, 'puppies');
  assert.equal(getSeoRouteConfig(['kittens-for-sale'])?.keyword, 'kittens');
});
