'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getVerifiedAccessToken } from '../../lib/authTokens';

const PAGE_SIZE = 12;

async function fetchJson(url, options = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } finally {
    clearTimeout(timeout);
  }
}

function getStatusClass(status) {
  if (status === 'approved') return 'bg-green-100 text-green-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-orange-100 text-orange-700';
}

export default function MyListingsSimple() {
  const [listings, setListings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadListings = async () => {
      setLoading(true);
      setError('');

      try {
        const token = await getVerifiedAccessToken();
        if (!token) throw new Error('Please log in again.');

        const { response, data } = await fetchJson(`/api/profile/listings?page=${page}&pageSize=${PAGE_SIZE}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(data.error || 'Could not load listings.');
        if (!active) return;

        setListings(data.listings || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setLoaded(true);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message || 'Could not load listings.');
        setLoaded(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = window.setTimeout(loadListings, 100);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [page]);

  const deleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      const token = await getVerifiedAccessToken();
      if (!token) throw new Error('Please log in again.');

      const { response, data } = await fetchJson(`/api/profile/listings/${listingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(data.error || 'Could not delete listing.');

      if (data.warning) setError(data.warning);

      const remaining = listings.filter((listing) => listing.id !== listingId);
      setListings(remaining);
      setTotalCount((current) => Math.max(current - 1, 0));

      if (remaining.length === 0 && page > 1) {
        setPage((current) => current - 1);
      }
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete listing.');
    }
  };

  return (
    <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-(--border-beige) pb-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-(--secondary-green)">My Listings</h2>
          <p className="mt-1 text-sm text-(--muted-green-text)">
            {loading ? 'Loading your listings...' : `${totalCount} submitted ad${totalCount === 1 ? '' : 's'}.`}
          </p>
        </div>
        <Link href="/post-ad" className="rounded-xl bg-(--primary-orange) px-5 py-3 text-center text-sm font-bold text-white">Post new ad</Link>
      </div>

      {loading && (
        <div className="mt-6 rounded-2xl border border-dashed border-(--border-beige) bg-(--background) p-8 text-center">
          <h3 className="text-lg font-extrabold text-(--secondary-green)">Loading listings...</h3>
          <p className="mt-1 text-sm text-(--muted-green-text)">Fetching your ads.</p>
        </div>
      )}

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

      {loaded && listings.length === 0 && !error && !loading && (
        <div className="mt-6 rounded-2xl border border-dashed border-(--border-beige) bg-(--background) p-8 text-center">
          <h3 className="text-lg font-extrabold text-(--secondary-green)">No listings yet</h3>
          <p className="mt-1 text-sm text-(--muted-green-text)">Your submitted ads will appear here.</p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => {
            const thumbnail = listing.first_photo?.image_url;

            return (
              <article key={listing.id} className="overflow-hidden rounded-2xl border border-(--border-beige) bg-(--background) shadow-sm">
                <div className="h-40 bg-(--light-green)">
                  {thumbnail ? (
                    <img src={thumbnail} alt={listing.title || 'Listing photo'} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-(--muted-green-text)">No image</div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-base font-extrabold text-(--secondary-green)">{listing.title}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-extrabold ${getStatusClass(listing.status)}`}>{listing.status || 'pending'}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-(--primary-green)">
                    {listing.price !== null && listing.price !== undefined && listing.price !== '' ? `€${listing.price}` : listing.listing_type === 'For Adoption' ? 'Adoption' : 'Contact'}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-(--muted-green-text)">{listing.breed || listing.animal_type || 'Pet'} · {listing.county || 'Ireland'}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link href={`/listings/${listing.id}?ownerPreview=true`} className="rounded-xl border border-(--border-beige) bg-white px-3 py-2 text-center text-xs font-bold text-(--secondary-green)">Preview</Link>
                    <Link href={`/profile/listings/${listing.id}/edit`} className="rounded-xl bg-(--primary-green) px-3 py-2 text-center text-xs font-bold text-white">Edit</Link>
                    <button type="button" onClick={() => deleteListing(listing.id)} className="col-span-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600">Delete listing</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-xl border border-(--border-beige) bg-white px-4 py-2 text-sm font-bold disabled:opacity-50">Previous</button>
          <span className="text-sm font-bold text-(--muted-green-text)">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-xl border border-(--border-beige) bg-white px-4 py-2 text-sm font-bold disabled:opacity-50">Next</button>
        </div>
      )}
    </section>
  );
}
