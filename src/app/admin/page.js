'use client';

import { useEffect, useState } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import Link from 'next/link';
import { getVerifiedAdminAccessToken } from '../../lib/authTokens';
import { PawIcon } from '../../components/Icons';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'reports'];
const LISTING_STATUS_FILTERS = ['pending', 'approved', 'rejected'];

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

export default function AdminPage() {
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  const handleApiAuthError = (response) => {
    if (response.status === 401 || response.status === 403) {
      setAccessDenied(true);
      return true;
    }

    return false;
  };

  const getAdminToken = async () => {
    const accessToken = await getVerifiedAdminAccessToken({ setAccessDenied });

    if (!accessToken) {
      setAccessDenied(true);
      setCheckingAdmin(false);
      setLoading(false);
      return null;
    }

    return accessToken;
  };

  const loadListings = async (status) => {
    if (!LISTING_STATUS_FILTERS.includes(status)) {
      setListings([]);
      setLoading(false);
      setCheckingAdmin(false);
      return;
    }

    setLoading(true);

    try {
      const accessToken = await getAdminToken();

      if (!accessToken) return;

      const response = await fetch(`/api/admin/listings?status=${encodeURIComponent(status)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (!handleApiAuthError(response)) {
          console.error('Admin listings fetch failed:', result);
          alert(result.error || 'Could not load admin listings.');
        }

        setListings([]);
        return;
      }

      setListings(result.listings || []);
    } catch (error) {
      console.error('Admin listings fetch error:', error);
      setListings([]);
      alert('Could not load admin listings.');
    } finally {
      setLoading(false);
      setCheckingAdmin(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);

    try {
      const accessToken = await getAdminToken();

      if (!accessToken) return;

      const response = await fetch('/api/admin/reports', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (!handleApiAuthError(response)) {
          console.error('Admin reports fetch failed:', result);
          alert(result.error || 'Could not load reports.');
        }

        setReports([]);
        return;
      }

      setReports(result.reports || []);
    } catch (error) {
      console.error('Admin reports fetch error:', error);
      setReports([]);
      alert('Could not load reports.');
    } finally {
      setLoading(false);
      setCheckingAdmin(false);
    }
  };

  useEffect(() => {
    if (selectedStatus === 'reports') {
      loadReports();
    } else {
      loadListings(selectedStatus);
    }
  }, [selectedStatus]);

  const updateListingStatus = async (listingId, status) => {
    try {
      const accessToken = await getAdminToken();

      if (!accessToken) return;

      const response = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (!handleApiAuthError(response)) {
          console.warn('Update listing API failed:', result);
          alert(result.error || 'Could not update listing.');
        }

        return;
      }

      setListings((current) => current.map((listing) => (listing.id === listingId ? { ...listing, status } : listing)));
    } catch (error) {
      console.error('Update listing status error:', error);
      alert('Could not update listing.');
    }
  };

  const deleteListing = async (listingId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this listing?');

    if (!confirmDelete) return;

    try {
      const accessToken = await getAdminToken();

      if (!accessToken) return;

      const response = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (!handleApiAuthError(response)) {
          console.error('Delete listing API failed:', result);
          alert(result.error || 'Could not delete listing.');
        }

        return;
      }

      setListings((current) => current.filter((listing) => listing.id !== listingId));
      setReports((current) => current.filter((report) => report.listing_id !== listingId));
    } catch (error) {
      console.error('Delete listing error:', error);
      alert('Could not delete listing.');
    }
  };

  const markReportReviewed = async (reportId) => {
    try {
      const accessToken = await getAdminToken();

      if (!accessToken) {
        alert('You must be logged in as admin.');
        return;
      }

      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'reviewed' }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (!handleApiAuthError(response)) {
          console.warn('Report review API failed:', result);
          alert(result.error || 'Could not mark report as reviewed.');
        }

        return;
      }

      setReports((current) =>
        current.map((report) => (report.id === reportId ? { ...report, status: 'reviewed' } : report)),
      );
    } catch (error) {
      console.warn('Report review error:', error);
      alert('Could not mark report as reviewed.');
    }
  };

  const deleteReport = async (reportId) => {
    const confirmed = window.confirm('Delete this report?');

    if (!confirmed) return;

    try {
      const accessToken = await getAdminToken();

      if (!accessToken) {
        alert('You must be logged in as admin.');
        return;
      }

      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (!handleApiAuthError(response)) {
          console.warn('Delete report API failed:', result);
          alert(result.error || 'Could not delete report.');
        }

        return;
      }

      setReports((current) => current.filter((report) => report.id !== reportId));
    } catch (error) {
      console.warn('Delete report error:', error);
      alert('Could not delete report.');
    }
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

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-(--background)">
        <Header />

        <main className="mx-auto flex min-h-[65vh] max-w-[900px] items-center justify-center px-6 py-12">
          <div className="w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-red-500">403 Forbidden</p>

            <h1 className="mt-3 text-3xl font-extrabold text-(--secondary-green)">You do not have access to this page</h1>

            <p className="mx-auto mt-4 max-w-[560px] text-sm leading-6 text-(--muted-green-text)">
              This area is restricted to PawHome administrators only.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-full bg-(--primary-orange) px-6 py-3 text-sm font-bold text-white transition hover:bg-(--secondary-orange)"
            >
              Back to homepage
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-[1440px] px-6 py-10">
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
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-(--light-green) text-(--primary-green)">
        <PawIcon className="h-8 w-8" />
      </div>

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
        <div className="relative h-64 bg-(--light-green) lg:h-full">
          {listing.mainImage ? (
            <img
              src={listing.mainImage}
              alt={listing.breed || listing.animal_type || 'Listing image'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-(--primary-green)">
              <PawIcon className="h-14 w-14" />
            </div>
          )}

          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-(--secondary-green)">
            {listing.photoCount || 0} photos
          </span>

          <StatusBadge status={listing.status} />
        </div>

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
            <img src={report.mainImage} alt={listing?.title || listing?.breed || 'Reported listing'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-(--primary-green)">
              <PawIcon className="h-14 w-14" />
            </div>
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
                    <span key={item} className="rounded-full bg-(--background) px-3 py-1 text-xs font-bold text-(--secondary-green)">
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

  return <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>{status}</span>;
};

const ListingTags = ({ listing }) => {
  const tags = [listing.animal_type, listing.breed, listing.age, listing.sex, listing.county, listing.seller_type].filter(Boolean);

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((item) => (
        <span key={item} className="rounded-full bg-(--background) px-3 py-1 text-xs font-bold text-(--secondary-green)">
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
