'use client';

import { useEffect, useState } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'reports'];

const formatDate = (value) => {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const yesNo = (value) => {
  if (!value) return '-';
  if (value === 'Yes' || value === true) return 'Yes';
  if (value === 'No' || value === false) return 'No';

  return value;
};

const getMainImageData = (photos) => {
  const sortedPhotos = [...(photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return {
    mainImage: sortedPhotos[0]?.image_url,
    photoCount: sortedPhotos.length,
  };
};

export default function AdminPage() {
  // Auth state
  const [user, setUser] = useState(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Listing state
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  // Check admin access on page load
  useEffect(() => {
    const checkAdminAndLoad = async () => {
      setCheckingAdmin(true);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = '/';
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminError || !adminData) {
        window.location.href = '/';
        return;
      }

      setUser(user);
      setCheckingAdmin(false);
      loadListings(selectedStatus);
    };

    checkAdminAndLoad();
  }, []);

  // Reload listings when status tab changes
  useEffect(() => {
    if (!user) return;

    if (selectedStatus === 'reports') {
      loadReports();
    } else {
      loadListings(selectedStatus);
    }
  }, [selectedStatus, user]);

  const loadListings = async (status) => {
    setLoading(true);

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
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin listings fetch error:', error);
      setListings([]);
      setLoading(false);
      return;
    }

    const formattedListings = (data || []).map((listing) => {
      const { mainImage, photoCount } = getMainImageData(listing.listing_photos);

      return {
        ...listing,
        mainImage,
        photoCount,
      };
    });

    setListings(formattedListings);
    setLoading(false);
  };
  const loadReports = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('listing_reports')
      .select(
        `
      *,
      listings (
        id,
        title,
        breed,
        animal_type,
        county,
        status,
        listing_photos (
          image_url,
          sort_order
        )
      )
    `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Reports fetch error:', error);
      setReports([]);
      setLoading(false);
      return;
    }

    const formattedReports = (data || []).map((report) => {
      const { mainImage, photoCount } = getMainImageData(report.listings?.listing_photos);

      return {
        ...report,
        mainImage,
        photoCount,
      };
    });

    setReports(formattedReports);
    setLoading(false);
  };

  const updateListingStatus = async (listingId, newStatus) => {
    const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', listingId);

    if (error) {
      console.error('Status update error:', error);
      alert('Could not update listing status.');
      return;
    }

    setListings((current) => current.filter((listing) => listing.id !== listingId));
  };

  const deleteListing = async (listingId) => {
    const confirmed = window.confirm('Are you sure you want to delete this listing? This cannot be undone.');

    if (!confirmed) return;

    const { error } = await supabase.from('listings').delete().eq('id', listingId);

    if (error) {
      console.error('Delete listing error:', error);
      alert('Could not delete listing.');
      return;
    }

    setListings((current) => current.filter((listing) => listing.id !== listingId));
  };
  const markReportReviewed = async (reportId) => {
    const { error } = await supabase.from('listing_reports').update({ status: 'reviewed' }).eq('id', reportId);

    if (error) {
      console.error('Report review error:', error);
      alert('Could not mark report as reviewed.');
      return;
    }

    setReports((current) =>
      current.map((report) => (report.id === reportId ? { ...report, status: 'reviewed' } : report)),
    );
  };

  const deleteReport = async (reportId) => {
    const confirmed = window.confirm('Delete this report?');

    if (!confirmed) return;

    const { error } = await supabase.from('listing_reports').delete().eq('id', reportId);

    if (error) {
      console.error('Delete report error:', error);
      alert('Could not delete report.');
      return;
    }

    setReports((current) => current.filter((report) => report.id !== reportId));
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-(--background)">
        <Header />

        <main className="mx-auto max-w-[1280px] px-6 py-10">
          <p className="text-sm text-(--secondary-green)">Checking admin...</p>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-[1440px] px-6 py-10">
        {/* Page header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold text-(--primary-green)">PawHome Admin</p>

            <h1 className="mt-2 text-4xl font-extrabold text-(--secondary-green)">Listing Review</h1>

            <p className="mt-3 text-sm text-(--muted-green-text)">
              Review submitted ads before they appear publicly on PawHome.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`rounded-xl px-5 py-3 text-sm font-bold capitalize transition ${
                  selectedStatus === status
                    ? 'bg-(--primary-green) text-white'
                    : 'border border-(--border-beige) bg-white text-(--secondary-green) hover:border-(--primary-green)'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Page content */}
        {selectedStatus === 'reports' ? (
          loading ? (
            <AdminMessageCard text="Loading reports..." />
          ) : reports.length === 0 ? (
            <EmptyState selectedStatus="reports" />
          ) : (
            <div className="space-y-6">
              {reports.map((report) => (
                <ReportReviewCard
                  key={report.id}
                  report={report}
                  markReportReviewed={markReportReviewed}
                  deleteReport={deleteReport}
                  updateListingStatus={updateListingStatus}
                  deleteListing={deleteListing}
                />
              ))}
            </div>
          )
        ) : loading ? (
          <AdminMessageCard text="Loading listings..." />
        ) : listings.length === 0 ? (
          <EmptyState selectedStatus={selectedStatus} />
        ) : (
          <div className="space-y-6">
            {listings.map((listing) => (
              <ListingReviewCard
                key={listing.id}
                listing={listing}
                selectedStatus={selectedStatus}
                updateListingStatus={updateListingStatus}
                deleteListing={deleteListing}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

const AdminMessageCard = ({ text }) => {
  return (
    <div className="rounded-3xl border border-(--border-beige) bg-white p-10">
      <p className="text-sm text-(--secondary-green)">{text}</p>
    </div>
  );
};

const EmptyState = ({ selectedStatus }) => {
  return (
    <div className="rounded-3xl border border-(--border-beige) bg-white p-10 text-center">
      <div className="text-4xl">🐾</div>

      <h2 className="mt-4 text-2xl font-extrabold text-(--secondary-green)">No {selectedStatus} listings</h2>

      <p className="mt-2 text-sm text-(--muted-green-text)">Listings with this status will appear here.</p>
    </div>
  );
};

const ListingReviewCard = ({ listing, selectedStatus, updateListingStatus, deleteListing }) => {
  const priceLabel =
    listing.price !== null && listing.price !== undefined && listing.price !== ''
      ? `€${listing.price}`
      : listing.listing_type === 'For Adoption'
        ? 'No fee listed'
        : '-';

  return (
    <article className="overflow-hidden rounded-3xl border border-(--border-beige) bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Listing image */}
        <div className="relative h-64 bg-(--light-green) lg:h-full">
          {listing.mainImage ? (
            <img
              src={listing.mainImage}
              alt={listing.breed || listing.animal_type || 'Listing image'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">🐾</div>
          )}

          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-(--secondary-green)">
            {listing.photoCount || 0} photos
          </span>

          <StatusBadge status={listing.status} />
        </div>

        {/* Listing details */}
        <div className="p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-bold text-(--primary-green)">{listing.listing_type || 'Listing'}</p>

              <h2 className="mt-1 text-3xl font-extrabold text-(--secondary-green)">
                {listing.title || listing.breed || listing.animal_type || 'Untitled listing'}
              </h2>

              <ListingTags listing={listing} />
            </div>

            <div className="rounded-2xl bg-(--light-green) px-5 py-4 text-right">
              <p className="text-xs font-semibold text-(--muted-green-text)">Price</p>

              <p className="text-2xl font-extrabold text-(--primary-green)">{priceLabel}</p>

              {listing.price_negotiable && <p className="mt-1 text-xs font-bold text-(--primary-green)">Negotiable</p>}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <DetailCard title="Health & Verification">
              <InfoRow label="Microchipped" value={yesNo(listing.microchipped)} />
              <InfoRow label="Vaccinated" value={yesNo(listing.vaccinated)} />
              <InfoRow label="Wormed" value={yesNo(listing.wormed)} />
              <InfoRow label="Vet Checked" value={yesNo(listing.vet_checked)} />
              <InfoRow label="IKC / KC" value={yesNo(listing.kennel_club_registered)} />
            </DetailCard>

            <DetailCard title="Litter / Background">
              <InfoRow label="Litter Size" value={listing.litter_size || '-'} />
              <InfoRow label="Available" value={listing.available_litter_count || '-'} />
              <InfoRow label="Date of Birth" value={formatDate(listing.date_of_birth)} />
              <InfoRow label="Ready to Leave" value={formatDate(listing.ready_to_leave)} />
              <InfoRow label="Mother Seen" value={yesNo(listing.mother_can_be_seen)} />
            </DetailCard>

            <DetailCard title="Seller">
              <InfoRow label="Seller Type" value={listing.seller_type || '-'} />
              <InfoRow label="Phone" value={listing.contact_phone || '-'} />
              <InfoRow label="Organisation" value={listing.organisation_name || '-'} />
              <InfoRow label="Registration" value={listing.registration_number || '-'} />
              <InfoRow label="Submitted" value={formatDate(listing.created_at)} />
            </DetailCard>
          </div>

          <div className="mt-5 rounded-2xl bg-(--background) p-4">
            <h3 className="font-bold text-(--secondary-green)">Description</h3>

            <p className="mt-2 line-clamp-4 text-sm leading-6 text-(--muted-green-text)">
              {listing.description || 'No description provided.'}
            </p>
          </div>

          <AdminActions
            listingId={listing.id}
            selectedStatus={selectedStatus}
            updateListingStatus={updateListingStatus}
            deleteListing={deleteListing}
          />
        </div>
      </div>
    </article>
  );
};

const ReportReviewCard = ({ report, markReportReviewed, deleteReport, updateListingStatus, deleteListing }) => {
  const listing = report.listings;

  return (
    <article className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <div className="relative h-64 bg-(--light-green) lg:h-full">
          {report.mainImage ? (
            <img
              src={report.mainImage}
              alt={listing?.title || listing?.breed || 'Reported listing'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">🐾</div>
          )}

          <span
            className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${
              report.status === 'reviewed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {report.status || 'open'}
          </span>
        </div>

        <div className="p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-bold text-red-600">Reported Listing</p>

              <h2 className="mt-1 text-3xl font-extrabold text-(--secondary-green)">
                {listing?.title || listing?.breed || listing?.animal_type || 'Unknown listing'}
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  listing?.animal_type,
                  listing?.breed,
                  listing?.county,
                  `Listing status: ${listing?.status || '-'}`,
                  `Reported: ${formatDate(report.created_at)}`,
                ]
                  .filter(Boolean)
                  .map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-(--background) px-3 py-1 text-xs font-bold text-(--secondary-green)"
                    >
                      {item}
                    </span>
                  ))}
              </div>
            </div>

            <div className="rounded-2xl bg-red-50 px-5 py-4 text-right">
              <p className="text-xs font-semibold text-red-600">Reason</p>
              <p className="text-sm font-extrabold text-red-700">{report.reason}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-(--background) p-4">
            <h3 className="font-bold text-(--secondary-green)">Report Details</h3>

            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-(--muted-green-text)">
              {report.details || 'No extra details provided.'}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-(--border-beige) pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {report.listing_id && (
                <Link
                  href={`/listings/${report.listing_id}?adminPreview=true`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-(--border-beige) bg-white px-5 py-3 text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)"
                >
                  Preview Listing
                </Link>
              )}

              <button
                type="button"
                onClick={() => markReportReviewed(report.id)}
                className="rounded-xl bg-(--primary-green) px-5 py-3 text-sm font-bold text-white transition hover:scale-105"
              >
                Mark Reviewed
              </button>

              {report.listing_id && (
                <button
                  type="button"
                  onClick={() => updateListingStatus(report.listing_id, 'rejected')}
                  className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-100"
                >
                  Reject Listing
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {report.listing_id && (
                <button
                  type="button"
                  onClick={() => deleteListing(report.listing_id)}
                  className="rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
                >
                  Delete Listing
                </button>
              )}

              <button
                type="button"
                onClick={() => deleteReport(report.id)}
                className="rounded-xl border border-(--border-beige) bg-white px-5 py-3 text-sm font-bold text-(--muted-green-text) transition hover:border-red-200 hover:text-red-600"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const StatusBadge = ({ status }) => {
  const statusClass =
    status === 'approved'
      ? 'bg-green-100 text-green-700'
      : status === 'rejected'
        ? 'bg-red-100 text-red-700'
        : 'bg-orange-100 text-orange-700';

  return (
    <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>{status}</span>
  );
};

const ListingTags = ({ listing }) => {
  const tags = [
    listing.animal_type,
    listing.breed,
    listing.age,
    listing.sex,
    listing.county,
    listing.seller_type,
  ].filter(Boolean);

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((item) => (
        <span
          key={item}
          className="rounded-full bg-(--background) px-3 py-1 text-xs font-bold text-(--secondary-green)"
        >
          {item}
        </span>
      ))}
    </div>
  );
};

const DetailCard = ({ title, children }) => {
  return (
    <div className="rounded-2xl border border-(--border-beige) bg-(--background) p-4">
      <h3 className="font-bold text-(--secondary-green)">{title}</h3>

      <div className="mt-3 space-y-2 text-sm">{children}</div>
    </div>
  );
};

const InfoRow = ({ label, value }) => {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-(--muted-green-text)">{label}</span>
      <span className="font-bold text-(--secondary-green)">{value}</span>
    </div>
  );
};

const AdminActions = ({ listingId, selectedStatus, updateListingStatus, deleteListing }) => {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-(--border-beige) pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/listings/${listingId}?adminPreview=true`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-(--border-beige) bg-white px-5 py-3 text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)"
        >
          Preview Ad
        </Link>

        {selectedStatus !== 'approved' && (
          <button
            type="button"
            onClick={() => updateListingStatus(listingId, 'approved')}
            className="rounded-xl bg-(--primary-green) px-5 py-3 text-sm font-bold text-white transition hover:scale-105"
          >
            Approve
          </button>
        )}

        {selectedStatus !== 'rejected' && (
          <button
            type="button"
            onClick={() => updateListingStatus(listingId, 'rejected')}
            className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-100"
          >
            Reject
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => deleteListing(listingId)}
        className="rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
      >
        Delete
      </button>
    </div>
  );
};
