'use client';

import { useEffect, useState } from 'react';
import Header from '../../components/header';
import { supabase } from '../../lib/supabaseClient';
import { adminUserIds } from '../../data/admins';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const loadAdminPage = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
        return;
      }

      if (!adminUserIds.includes(user.id)) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      const { data, error } = await supabase
        .from('listings')
        .select(
          `
          *,
          listing_photos (
            image_url,
            sort_order
          )
        `,
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Admin fetch error:', error);
        setLoading(false);
        return;
      }

      setListings(data || []);
      setLoading(false);
    };

    loadAdminPage();
  }, []);

  const updateStatus = async (listingId, status) => {
    setUpdatingId(listingId);

    const { error } = await supabase.from('listings').update({ status }).eq('id', listingId);

    if (error) {
      console.error('Update status error:', error);
      alert('Could not update listing.');
      setUpdatingId(null);
      return;
    }

    setListings((prev) => prev.filter((listing) => listing.id !== listingId));
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EC]">
        <Header />
        <main className="mx-auto max-w-[1500px] px-6 py-10">
          <p className="text-sm text-[#5F6F64]">Loading admin page...</p>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF6EC]">
        <Header />
        <main className="mx-auto max-w-[1500px] px-6 py-10">
          <div className="rounded-2xl border border-[#E8DFD1] bg-white px-8 py-14 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-[#123524]">Access denied</h1>
            <p className="mt-3 text-sm text-[#5F6F64]">You do not have permission to view this page.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <main className="mx-auto max-w-[1500px] px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#0E4F2A]">Admin</p>

          <h1 className="mt-2 text-3xl font-bold text-[#123524]">Pending Listings</h1>

          <p className="mt-3 text-sm text-[#5F6F64]">Review new listings before they appear publicly.</p>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-[#E8DFD1] bg-white px-8 py-14 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-[#123524]">No pending listings</h2>
            <p className="mt-3 text-sm text-[#5F6F64]">New submitted ads will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {listings.map((listing) => {
              const sortedPhotos = [...(listing.listing_photos || [])].sort((a, b) => a.sort_order - b.sort_order);

              const mainImage = sortedPhotos[0]?.image_url;

              return (
                <div
                  key={listing.id}
                  className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#E8DFD1] bg-white shadow-sm lg:grid-cols-[260px_1fr]"
                >
                  <div className="h-64 bg-[#DDEDD8] lg:h-full">
                    {mainImage ? (
                      <img src={mainImage} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">🐾</div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#FF8A2A]">Pending review</p>

                        <h2 className="mt-2 text-2xl font-bold text-[#123524]">{listing.title}</h2>

                        <p className="mt-2 text-sm text-[#5F6F64]">
                          {listing.animal_type} · {listing.breed || 'Unknown breed'}
                        </p>
                      </div>

                      {listing.price && (
                        <div className="rounded-xl bg-[#DDEDD8] px-4 py-3 text-lg font-bold text-[#0E4F2A]">
                          €{listing.price}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                      {listing.age && (
                        <span className="rounded-full bg-[#FAF6EC] px-3 py-1 text-[#123524]">{listing.age}</span>
                      )}

                      {listing.sex && (
                        <span className="rounded-full bg-[#FAF6EC] px-3 py-1 text-[#123524]">{listing.sex}</span>
                      )}

                      {listing.county && (
                        <span className="rounded-full bg-[#FAF6EC] px-3 py-1 text-[#123524]">{listing.county}</span>
                      )}

                      {listing.seller_type && (
                        <span className="rounded-full bg-[#FAF6EC] px-3 py-1 text-[#123524]">
                          {listing.seller_type}
                        </span>
                      )}

                      {['KC Registered', 'IKC Registered', 'Yes'].includes(listing.kennel_club_registered) && (
                        <span className="rounded-full bg-[#DDEDD8] px-3 py-1 text-[#0E4F2A]">
                          {listing.kennel_club_registered === 'Yes'
                            ? 'KC / IKC Registered'
                            : listing.kennel_club_registered}
                        </span>
                      )}
                    </div>

                    <p className="mt-5 line-clamp-3 text-sm leading-6 text-[#5F6F64]">
                      {listing.description || 'No description added.'}
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                      <Info label="Microchip" value={listing.microchip} />
                      <Info label="Vaccinated" value={listing.vaccinated} />
                      <Info label="Vet Checked" value={listing.vet_checked} />
                      <Info label="Phone" value={listing.contact_phone} />
                      <Info label="Seller Type" value={listing.seller_type} />
                      <Info label="Created" value={formatDate(listing.created_at)} />
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        disabled={updatingId === listing.id}
                        onClick={() => updateStatus(listing.id, 'approved')}
                        className="rounded-xl bg-[#0E4F2A] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {updatingId === listing.id ? 'Updating...' : 'Approve'}
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === listing.id}
                        onClick={() => updateStatus(listing.id, 'rejected')}
                        className="rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E8DFD1] bg-[#FFFCF5] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8A968D]">{label}</p>
      <p className="mt-2 font-semibold text-[#123524]">{value || 'Not provided'}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'Not provided';

  return new Date(value).toLocaleDateString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
