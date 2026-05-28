'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../components/header';
import { supabase } from '../../../lib/supabaseClient';

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = params.id;
  const [listing, setListing] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [mainPhoto, setMainPhoto] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
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
        .eq('id', listingId)
        .eq('status', 'approved')
        .single();

      if (error) {
        console.error('Listing detail error:', error);
        setLoading(false);
        return;
      }

      const sortedPhotos = [...(data.listing_photos || [])].sort((a, b) => a.sort_order - b.sort_order);

      setListing(data);
      setPhotos(sortedPhotos);
      setMainPhoto(sortedPhotos[0]?.image_url || '');
      setLoading(false);
    };

    fetchListing();
  }, [listingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EC]">
        <Header />
        <main className="mx-auto max-w-[1500px] px-6 py-10">
          <p className="text-sm text-[#5F6F64]">Loading listing...</p>
        </main>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#FAF6EC]">
        <Header />
        <main className="mx-auto max-w-[1500px] px-6 py-10">
          <div className="rounded-2xl border border-[#E8DFD1] bg-white px-8 py-14 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-[#123524]">Listing not found</h1>
            <p className="mt-3 text-sm text-[#5F6F64]">This listing may still be pending review or has been removed.</p>
            <a
              href="/listings"
              className="mt-6 inline-flex rounded-xl bg-[#0E4F2A] px-6 py-3 text-sm font-semibold text-white"
            >
              Back to listings
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <main className="mx-auto max-w-[1500px] px-6 py-10">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-[#5F6F64]">
          <a href="/" className="hover:text-[#0E4F2A]">
            Home
          </a>
          <span className="mx-2">›</span>
          <a href="/listings" className="hover:text-[#0E4F2A]">
            Listings
          </a>
          <span className="mx-2">›</span>
          <span>{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
          {/* Left side */}
          <section>
            {/* Main image */}
            <div className="overflow-hidden rounded-3xl border border-[#E8DFD1] bg-white shadow-sm">
              <div className="h-[520px] bg-[#DDEDD8]">
                {mainPhoto ? (
                  <img src={mainPhoto} alt={listing.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl">🐾</div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-4 md:grid-cols-6">
                {photos.map((photo) => (
                  <button
                    key={photo.image_url}
                    type="button"
                    onClick={() => setMainPhoto(photo.image_url)}
                    className={`overflow-hidden rounded-xl border bg-white ${
                      mainPhoto === photo.image_url ? 'border-[#0E4F2A]' : 'border-[#E8DFD1]'
                    }`}
                  >
                    <img src={photo.image_url} alt="Pet thumbnail" className="h-24 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-8 rounded-2xl border border-[#E8DFD1] bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-bold text-[#123524]">Description</h2>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5F6F64]">
                {listing.description || 'No description added.'}
              </p>
            </div>

            {/* Health & Verification */}
            <div className="mt-8 rounded-2xl border border-[#E8DFD1] bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-bold text-[#123524]">Health & Verification</h2>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoItem label="Microchip" value={listing.microchip} />
                <InfoItem label="Vaccinated" value={listing.vaccinated} />
                <InfoItem label="Wormed" value={listing.wormed} />
                <InfoItem label="Vet Checked" value={listing.vet_checked} />
                <InfoItem label="Spayed / Neutered" value={listing.spayed_neutered} />
                <InfoItem label="Health Tested" value={listing.health_tested} />
                <InfoItem label="KC / IKC Registered" value={listing.kennel_club_registered} />
                <InfoItem label="Breeding Rights" value={listing.breeding_rights} />
                <InfoItem label="Proven Stud" value={listing.proven_stud} />
              </div>
            </div>
          </section>

          {/* Right side */}
          <aside className="h-fit rounded-3xl border border-[#E8DFD1] bg-white p-7 shadow-sm">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-semibold text-[#0E4F2A]">{listing.listing_type || 'Listing'}</p>

                <h1 className="mt-2 text-3xl font-bold leading-tight text-[#123524]">{listing.title}</h1>
              </div>

              {listing.price && (
                <div className="rounded-xl bg-[#DDEDD8] px-4 py-3 text-lg font-bold text-[#0E4F2A]">
                  €{listing.price}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              {listing.animal_type && <Badge>{listing.animal_type}</Badge>}

              {listing.breed && <Badge>{listing.breed}</Badge>}

              {listing.age && <Badge>{listing.age}</Badge>}

              {listing.sex && <Badge>{listing.sex}</Badge>}

              {listing.county && <Badge>{listing.county}</Badge>}

              {['IKC Registered', 'KC Registered'].includes(listing.kennel_club_registered) && (
                <GreenBadge>{listing.kennel_club_registered}</GreenBadge>
              )}
            </div>

            <div className="mt-8 border-t border-[#E8DFD1] pt-6">
              <h2 className="text-lg font-bold text-[#123524]">Listing Details</h2>

              <div className="mt-5 space-y-4">
                <SideItem label="Animal Type" value={listing.animal_type} />
                <SideItem label="Breed / Type" value={listing.breed} />
                <SideItem label="Age" value={listing.age} />
                <SideItem label="Sex" value={listing.sex} />
                <SideItem label="County" value={listing.county} />
                <SideItem label="City / Town" value={listing.city} />
                <SideItem label="Seller Type" value={listing.seller_type} />
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-[#FFFCF5] p-5">
              <h3 className="font-bold text-[#123524]">Contact Seller</h3>

              <p className="mt-2 text-sm leading-6 text-[#5F6F64]">
                Contact the seller directly. Always verify the pet details before arranging a visit.
              </p>

              {showPhone ? (
                <div className="mt-5 rounded-xl border border-[#E8DFD1] bg-white p-4 text-center">
                  <p className="text-sm text-[#5F6F64]">Phone number</p>

                  {listing.contact_phone ? (
                    <a href={`tel:${listing.contact_phone}`} className="mt-1 block text-xl font-bold text-[#0E4F2A]">
                      {listing.contact_phone}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-[#123524]">No phone number provided.</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPhone(true)}
                  className="mt-5 w-full rounded-xl bg-[#FF8A2A] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E96F12]"
                >
                  Show Phone Number
                </button>
              )}
            </div>

            <a href="/listings" className="mt-5 block text-center text-sm font-semibold text-[#0E4F2A]">
              ← Back to listings
            </a>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Badge({ children }) {
  return <span className="rounded-full bg-[#FAF6EC] px-3 py-1 text-[#123524]">{children}</span>;
}

function GreenBadge({ children }) {
  return <span className="rounded-full bg-[#DDEDD8] px-3 py-1 text-[#0E4F2A]">{children}</span>;
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E8DFD1] bg-[#FFFCF5] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8A968D]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#123524]">{value || 'Not provided'}</p>
    </div>
  );
}

function SideItem({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EFE5D6] pb-3">
      <span className="text-sm text-[#5F6F64]">{label}</span>
      <span className="text-right text-sm font-semibold text-[#123524]">{value || 'Not provided'}</span>
    </div>
  );
}
