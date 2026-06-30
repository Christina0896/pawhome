'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getVerifiedAccessToken, getVerifiedAdminAccessToken } from '../../../lib/authTokens';
import ListingDetailClient from './ListingDetailClient';

export default function AdminListingPreviewClient({ listingId, mode = 'admin' }) {
  const [listing, setListing] = useState(null);
  const [similarListings, setSimilarListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isOwnerPreview = mode === 'owner';

  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true);
      setError('');

      const accessToken = isOwnerPreview ? await getVerifiedAccessToken() : await getVerifiedAdminAccessToken();

      if (!accessToken) {
        setError(isOwnerPreview ? 'Please log in to preview this listing.' : 'Admin access is required to preview this listing.');
        setLoading(false);
        return;
      }

      try {
        const previewUrl = isOwnerPreview
          ? `/api/profile/listings/${listingId}/preview`
          : `/api/admin/listings/${listingId}/preview`;

        const response = await fetch(previewUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Could not load listing preview.');
          setLoading(false);
          return;
        }

        setListing(result.listing || null);
        setSimilarListings(result.similarListings || []);
        setLoading(false);
      } catch (previewError) {
        console.warn('Preview load failed:', previewError);
        setError('Could not load listing preview.');
        setLoading(false);
      }
    };

    loadPreview();
  }, [listingId, isOwnerPreview]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[700px] flex-col items-center justify-center px-6 text-center">
        <div className="rounded-3xl border border-(--border-beige) bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-(--primary-green)">{isOwnerPreview ? 'Loading your preview...' : 'Loading admin preview...'}</p>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[700px] flex-col items-center justify-center px-6 text-center">
        <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-red-500">{isOwnerPreview ? 'Preview unavailable' : 'Admin preview unavailable'}</p>
          <h1 className="mt-3 text-3xl font-extrabold text-(--secondary-green)">Could not load this listing</h1>
          <p className="mt-4 text-sm leading-6 text-(--muted-green-text)">{error || 'Listing not found.'}</p>
          <Link
            href={isOwnerPreview ? '/profile' : '/admin'}
            className="mt-6 inline-flex rounded-full bg-(--primary-green) px-6 py-3 text-sm font-bold text-white transition hover:bg-(--secondary-green)"
          >
            {isOwnerPreview ? 'Back to profile' : 'Back to admin'}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-(--page-max-width) px-6 pt-5">
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm font-bold text-orange-800">
          {isOwnerPreview ? 'Your preview' : 'Admin preview'}: this listing is currently <span className="uppercase">{listing.status || 'unknown'}</span> and is not visible publicly until approved.
        </div>
      </div>

      <ListingDetailClient listing={listing} similarListings={similarListings} />
    </>
  );
}
