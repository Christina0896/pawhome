'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getVerifiedAccessToken } from '../../../lib/authTokens';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import ListingCard from '../../../components/ListingCard';
import {
  AgeIcon,
  AvailableIcon,
  BirthIcon,
  CalendarIcon,
  ChipIcon,
  EyeIcon,
  FemaleIcon,
  HealthIcon,
  HeartIcon,
  LitterIcon,
  LocationIcon,
  MaleIcon,
  MixedGenderIcon,
  PaperIcon,
  PawIcon,
  PhoneIcon,
  ShareIcon,
  ShieldCheckIcon,
  VaccineIcon,
  VetIcon,
  WormIcon,
  NeuteredIcon,
  ArrowIcon,
} from '../../../components/Icons';

function formatDate(value, options) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IE', options);
}

function sortPhotos(photos) {
  return [...(photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

function yesNo(value) {
  if (!value) return '-';
  if (value === 'Yes' || value === true) return 'Yes ✅';
  if (value === 'No' || value === false) return 'No ❌';
  return value;
}

function getSexIcon(sex) {
  const value = sex?.toLowerCase();
  if (value === 'female') return <FemaleIcon />;
  if (value === 'male') return <MaleIcon />;
  if (value === 'mixed' || value === 'mixed litter' || value === 'mixed gender' || value === 'mixed genders') {
    return <MixedGenderIcon />;
  }
  return null;
}

const InfoPill = ({ icon, text }) => {
  if (!text) return null;
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-(--background) px-2.5 py-2 text-xs font-bold text-(--primary-green)">
      <span className="flex h-4 w-4 items-center justify-center text-(--secondary-green)">{icon}</span>
      {text}
    </span>
  );
};

const DetailGroup = ({ title, items }) => (
  <div>
    <h3 className="text-base font-bold text-(--secondary-green)">{title}</h3>
    <div className="divide-y divide-(--border-beige)">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between py-1.5 text-sm">
          <div className="flex min-w-0 items-center gap-3 text-black">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--background) text-xs">
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
          </div>
          <span className="shrink-0 text-right font-bold text-(--secondary-green)">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const SellerInfoRow = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="text-(--muted-green-text)">{label}</span>
    <span className="text-right font-bold text-(--secondary-green)">{value}</span>
  </div>
);

export default function ListingDetailClient({ listing: initialListing, similarListings = [] }) {
  const { user } = useAuth();
  const [listing, setListing] = useState(initialListing);
  const [photos] = useState(sortPhotos(initialListing?.listing_photos));
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState('');
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const mainImage = photos[selectedPhotoIndex]?.image_url || '/img/logo.png';
  const title = listing.title || `${listing.breed || listing.animal_type || 'Pet'} available`;
  const locationTown = listing.city || '';
  const locationText = [locationTown, listing.county, 'Ireland'].filter(Boolean).join(', ');
  const sellerMemberSince = listing.seller_member_since
    ? formatDate(listing.seller_member_since, { month: 'long', year: 'numeric' })
    : '-';
  const dateOfBirth = listing.date_of_birth
    ? formatDate(listing.date_of_birth, { day: '2-digit', month: 'long', year: 'numeric' })
    : listing.dob || '-';
  const readyToLeave = listing.ready_to_leave
    ? formatDate(listing.ready_to_leave, { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';
  const priceDisplay =
    listing.price !== null && listing.price !== undefined && listing.price !== ''
      ? `€${listing.price}`
      : listing.listing_type === 'For Adoption'
        ? 'No fee listed'
        : 'Price not listed';
  const descriptionText = listing.description || 'No description provided.';
  const isLongDescription = descriptionText.length > 420;

  const listingTags = [listing.breed, listing.age, listing.sex, listing.county].filter(Boolean);

  const healthItems = [
    { label: 'Current Age', value: listing.age || '-', icon: <AgeIcon /> },
    { label: 'Microchipped', value: yesNo(listing.microchipped), icon: <ChipIcon /> },
    { label: 'Wormed', value: yesNo(listing.wormed), icon: <WormIcon /> },
    { label: 'Vaccinated', value: yesNo(listing.vaccinated), icon: <VaccineIcon /> },
    { label: 'Vet Checked', value: yesNo(listing.vet_checked), icon: <VetIcon /> },
    { label: 'Neutered', value: yesNo(listing.spayed_neutered), icon: <NeuteredIcon /> },
  ];

  const litterItems = [
    { label: 'Litter Size', value: listing.litter_size || '-', icon: <LitterIcon /> },
    { label: 'Available', value: listing.available_litter_count || '-', icon: <AvailableIcon /> },
    { label: 'Date of Birth', value: dateOfBirth, icon: <BirthIcon /> },
    { label: 'Ready to Leave', value: readyToLeave, icon: <CalendarIcon /> },
    { label: 'Mother Can Be Seen', value: yesNo(listing.mother_can_be_seen), icon: <EyeIcon /> },
    { label: 'Kennel Club Paperwork', value: yesNo(listing.kennel_club_registered), icon: <PaperIcon /> },
  ];

  useEffect(() => {
    const checkFavourite = async () => {
      if (!user || !listing?.id) {
        setIsFavourite(false);
        return;
      }

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listing.id)
        .maybeSingle();

      setIsFavourite(Boolean(data));
    };

    checkFavourite();
  }, [user, listing?.id]);

  useEffect(() => {
    if (!listing?.id) return;

    const trackView = async () => {
      try {
        const response = await fetch(`/api/listings/${listing.id}/view`, { method: 'POST' });
        const result = await response.json();

        if (response.ok && result.views !== undefined && result.views !== null) {
          setListing((current) => ({ ...current, views: result.views }));
        }
      } catch (error) {
        console.warn('View request failed:', error);
      }
    };

    trackView();
  }, [listing?.id]);

  const handlePreviousPhoto = () => {
    if (photos.length === 0) return;
    setSelectedPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    if (photos.length === 0) return;
    setSelectedPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleCopyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    alert('Listing link copied.');
  };

  const handleToggleFavourite = async () => {
    if (!listing?.id) return;

    const accessToken = await getVerifiedAccessToken();
    if (!accessToken) return;

    const previousIsFavourite = isFavourite;
    const previousCount = listing.favourites_count || 0;
    const nextIsFavourite = !previousIsFavourite;
    const nextCount = Math.max(previousCount + (nextIsFavourite ? 1 : -1), 0);

    setIsFavourite(nextIsFavourite);
    setListing((current) => ({ ...current, favourites_count: nextCount }));

    try {
      const response = await fetch(`/api/favorites/${listing.id}`, {
        method: nextIsFavourite ? 'POST' : 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json();

      if (!response.ok) {
        setIsFavourite(previousIsFavourite);
        setListing((current) => ({ ...current, favourites_count: previousCount }));
        alert(result.error || 'Could not update favourite.');
        return;
      }

      setIsFavourite(Boolean(result.isFavorite));
    } catch (error) {
      console.warn('Single listing favourite request failed:', error);
      setIsFavourite(previousIsFavourite);
      setListing((current) => ({ ...current, favourites_count: previousCount }));
      alert('Could not update favourite.');
    }
  };

  const handleShowPhoneNumber = async () => {
    if (!listing?.id) return;

    try {
      const response = await fetch(`/api/listings/${listing.id}/phone-click`, { method: 'POST' });
      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Could not reveal phone number.');
        return;
      }

      setRevealedPhone(result.phoneNumber || '');
      setPhoneVisible(true);

      if (result.phoneClicks !== undefined && result.phoneClicks !== null) {
        setListing((current) => ({ ...current, phone_clicks: result.phoneClicks }));
      }
    } catch (error) {
      console.warn('Phone click request failed:', error);
      alert('Could not reveal phone number.');
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!reportReason) {
      alert('Please select a reason.');
      return;
    }

    setReportSubmitting(true);

    try {
      const accessToken = await getVerifiedAccessToken();

      if (!accessToken) {
        setReportSubmitting(false);
        return;
      }

      const response = await fetch(`/api/listings/${listing.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason: reportReason, details: reportDetails }),
      });

      const result = await response.json();
      setReportSubmitting(false);

      if (!response.ok) {
        alert(result.error || 'Could not submit report. Please try again.');
        return;
      }

      setReportSuccess(true);
      setReportReason('');
      setReportDetails('');
    } catch (error) {
      console.error('Report listing error:', error);
      setReportSubmitting(false);
      alert('Could not submit report. Please try again.');
    }
  };

  const mapUrl = useMemo(() => {
    if (!locationText) return '';
    return `https://maps.google.com/maps?hl=en&q=${encodeURIComponent(locationText)}&z=11&t=m&output=embed`;
  }, [locationText]);

  return (
    <main className="mx-auto max-w-(--page-max-width) px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-(--muted-green-text)">
        <Link href="/" className="hover:text-(--primary-green)">Home</Link>
        <span>›</span>
        <Link href="/listings" className="hover:text-(--primary-green)">Listings</Link>
        <span>›</span>
        <span className="font-semibold text-(--secondary-green)">{title}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-(--border-beige) bg-white p-5 shadow-[0_14px_34px_rgba(18,53,36,0.08)]">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <h1 className="text-3xl font-extrabold leading-tight text-(--secondary-green) md:text-4xl">{title}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  {listing.breed && <InfoPill icon={<PawIcon />} text={listing.breed} />}
                  {listing.sex && listing.sex !== 'Mixed Litter' && <InfoPill icon={getSexIcon(listing.sex)} text={listing.sex} />}
                  {listing.sex === 'Mixed Litter' && (
                    <>
                      <InfoPill icon={<MaleIcon className="h-5 w-5 text-(--primary-green)" />} text={`${listing.male_count || 0} boys`} />
                      <InfoPill icon={<FemaleIcon className="h-5 w-5 text-(--primary-green)" />} text={`${listing.female_count || 0} girls`} />
                    </>
                  )}
                  {listing.age && <InfoPill icon={<CalendarIcon />} text={listing.age} />}
                  {listing.county && <InfoPill icon={<LocationIcon />} text={listing.county} />}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-(--muted-green-text)">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Posted {formatDate(listing.created_at)}</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-4 md:items-end">
                <div className="text-left md:text-right">
                  <p className="text-3xl font-extrabold text-(--secondary-green)">{priceDisplay}</p>
                  {listing.price_negotiable && <p className="mt-1 text-sm font-bold text-(--primary-green)">Negotiable</p>}
                </div>
                <div className="mt-3 flex w-full items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 text-sm font-bold text-(--secondary-green) transition hover:text-(--primary-orange)"
                    aria-label="Share listing"
                  >
                    <ShareIcon className="h-5 w-5" /> <span>Share</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleFavourite}
                    className="flex items-center gap-2 text-sm font-bold text-(--secondary-green) transition hover:text-(--primary-orange)"
                    aria-label="Save listing"
                  >
                    <HeartIcon filled={isFavourite} className={`h-5 w-5 ${isFavourite ? 'text-red-500' : 'text-(--secondary-green)'}`} />
                    <span>{isFavourite ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="relative h-[280px] overflow-hidden rounded-3xl bg-(--light-green) sm:h-[420px] lg:h-[560px]">
                <button type="button" onClick={() => setImageModalOpen(true)} className="block h-full w-full cursor-zoom-in">
                  <Image src={mainImage} alt={title} fill priority sizes="(max-width: 1024px) 100vw, 70vw" className="object-cover" />
                </button>

                {photos.length > 0 && (
                  <div className="absolute right-5 top-5 rounded-full bg-black/70 px-4 py-1.5 text-sm font-bold text-white">
                    {selectedPhotoIndex + 1}/{photos.length}
                  </div>
                )}

                {photos.length > 1 && (
                  <>
                    <button type="button" onClick={handlePreviousPhoto} className="absolute left-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-xl font-bold text-(--secondary-green) shadow-md">‹</button>
                    <button type="button" onClick={handleNextPhoto} className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-xl font-bold text-(--secondary-green) shadow-md">›</button>
                  </>
                )}

                {photos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 z-20 max-w-[92%] -translate-x-1/2 rounded-2xl bg-white/92 px-2 py-2 shadow-[0_10px_26px_rgba(18,53,36,0.18)] backdrop-blur">
                    <div className="flex w-fit max-w-full gap-2 overflow-x-auto">
                      {photos.slice(0, 4).map((photo, index) => (
                        <button
                          key={photo.image_url}
                          type="button"
                          onClick={() => setSelectedPhotoIndex(index)}
                          className={`relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border-2 bg-(--light-green) transition ${
                            selectedPhotoIndex === index ? 'border-(--primary-orange)' : 'border-white hover:border-(--border-beige)'
                          }`}
                          aria-label={`View photo ${index + 1}`}
                        >
                          <Image src={photo.image_url} alt={`${title} photo ${index + 1}`} fill sizes="112px" className="object-cover" />
                          {index === 3 && photos.length > 4 && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-extrabold text-white">+{photos.length - 4}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
            <h2 className="text-[28px] font-extrabold leading-tight text-(--secondary-green)">Description</h2>
            <div className="mt-4 text-[15px] leading-7 text-(--secondary-green)">
              <div className={`space-y-5 ${isLongDescription && !descriptionExpanded ? 'max-h-[150px] overflow-hidden' : ''}`}>
                {descriptionText
                  .split('\n')
                  .filter((paragraph) => paragraph.trim() !== '')
                  .map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
              {isLongDescription && (
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded((current) => !current)}
                  className="mt-3 text-sm font-extrabold text-(--primary-green) hover:text-(--primary-orange)"
                >
                  {descriptionExpanded ? 'View less' : 'View more'}
                </button>
              )}
            </div>
            {listingTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {listingTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-(--background) px-3 py-1.5 text-xs font-bold text-(--secondary-green)">{tag}</span>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
            <div className="border-b border-(--border-beige) pb-4">
              <h2 className="text-[28px] font-extrabold leading-tight text-(--secondary-green)">Listing Details</h2>
              <p className="mt-1 text-sm text-(--muted-green-text)">Health, documents, and background information provided by the seller.</p>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-2">
              <DetailGroup title="Health & Docs" items={healthItems} />
              <DetailGroup title={listing.sex === 'Mixed Litter' ? 'Litter Information' : 'Pet Background'} items={litterItems} />
            </div>
          </section>

          {similarListings.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-extrabold text-(--secondary-green)">Similar Ads</h2>
                <Link href="/listings" className="flex items-center gap-1 text-sm font-bold text-(--primary-green) hover:text-(--primary-orange)">
                  View more <ArrowIcon />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {similarListings.map((similar) => (
                  <ListingCard key={similar.id} listing={similar} showFavorite={false} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit space-y-5 lg:sticky lg:top-24">
          <section className="overflow-hidden rounded-3xl border border-(--border-beige) bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-extrabold text-(--secondary-green)">About the Seller</h2>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--background) text-lg font-extrabold text-(--primary-green)">
                  {(listing.seller_name || 'Seller').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-extrabold text-(--secondary-green)">{listing.seller_name || 'Seller'}</p>
                  <p className="text-sm font-bold text-(--primary-green)">{listing.seller_type || 'Private Seller'}</p>
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm">
                <SellerInfoRow label="Member Since" value={sellerMemberSince} />
                <SellerInfoRow label="County / Location" value={listing.county || '-'} />
              </div>
              <button
                type="button"
                onClick={handleShowPhoneNumber}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-(--primary-orange) text-sm font-extrabold text-white transition hover:bg-(--secondary-orange)"
              >
                <span className="mx-2"><PhoneIcon /></span>
                {phoneVisible ? revealedPhone || 'Phone not provided' : 'Show Phone Number'}
              </button>
            </div>
            <div className="grid grid-cols-3 border-t border-(--border-beige) text-center text-xs">
              <div className="flex flex-col items-center border-r border-(--border-beige) px-3 py-3">
                <EyeIcon />
                <p className="mt-0.5 font-extrabold text-(--secondary-green)">{listing.views || 0}</p>
                <p className="text-(--muted-green-text)">views</p>
              </div>
              <div className="flex flex-col items-center border-r border-(--border-beige) px-3 py-3">
                <HeartIcon />
                <p className="mt-0.5 font-extrabold text-(--secondary-green)">{listing.favourites_count || 0}</p>
                <p className="text-(--muted-green-text)">favourites</p>
              </div>
              <div className="flex flex-col items-center px-3 py-3">
                <PhoneIcon className="h-4" />
                <p className="mt-1 font-extrabold text-(--secondary-green)">{listing.phone_clicks || 0}</p>
                <p className="text-(--muted-green-text)">phone clicks</p>
              </div>
            </div>
            <div className="border-t border-(--border-beige) p-5">
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(true);
                  setReportSuccess(false);
                }}
                className="w-full rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
              >
                ⚑ Report this listing
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--light-green) text-lg"><ShieldCheckIcon /></div>
              <div>
                <h2 className="text-xl font-extrabold text-(--secondary-green)">Buying Safely</h2>
                <p className="mt-1 text-sm leading-6 text-(--muted-green-text)">Take basic checks before agreeing to buy or reserve a pet.</p>
              </div>
            </div>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-(--secondary-green)">
              {[
                'Do not pay a deposit before seeing the pet in person.',
                'Dogs should not leave their mother before 8 weeks old.',
                'Ask to see the microchip certificate and seller ID.',
                'Meet at the seller’s home, not in a car park or public place.',
                'Bring a friend or family member when possible.',
              ].map((tip) => (
                <li key={tip} className="flex gap-3"><span className="font-bold text-(--primary-green)">✓</span><span>{tip}</span></li>
              ))}
            </ul>
            <Link href="/safety" className="mt-6 flex h-11 items-center justify-center rounded-xl border border-(--primary-green) text-sm font-bold text-(--primary-green) transition hover:bg-(--primary-green) hover:text-white">
              Learn more about safe buying
            </Link>
          </section>

          {locationText && (
            <section className="rounded-3xl border border-(--border-beige) bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--background)"><LocationIcon /></div>
                <div>
                  <h2 className="text-lg font-extrabold text-(--secondary-green)">Location</h2>
                  <p className="mt-1 text-sm font-semibold text-(--muted-green-text)">{locationText}</p>
                </div>
              </div>
              <div className="mt-1 h-[220px] overflow-hidden rounded-xl border border-(--border-beige)">
                <iframe title="Listing location map" src={mapUrl} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <p className="mt-3 text-xs leading-5 text-(--muted-green-text)">Approximate location only. The seller’s exact address is not shown.</p>
            </section>
          )}

          <section className="rounded-3xl border border-(--border-beige) bg-(--light-green) p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl text-(--primary-green)"><HealthIcon /></div>
              <div>
                <h2 className="text-lg font-extrabold text-(--secondary-green)">Don’t miss out</h2>
                <p className="mt-1 text-sm text-(--muted-green-text)">Save this listing and keep it in your favourites.</p>
              </div>
            </div>
            <button type="button" onClick={handleToggleFavourite} className="mt-5 w-full rounded-xl bg-(--primary-green) px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.02]">
              {isFavourite ? 'Saved to favourites' : '♡ Save this listing'}
            </button>
          </section>
        </aside>
      </div>

      {imageModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 px-4 py-6">
          <button type="button" onClick={() => setImageModalOpen(false)} className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-(--secondary-green)">×</button>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={handlePreviousPhoto} className="absolute left-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-3xl font-bold text-(--secondary-green)">‹</button>
              <button type="button" onClick={handleNextPhoto} className="absolute right-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-3xl font-bold text-(--secondary-green)">›</button>
            </>
          )}
          <div className="relative h-[90vh] w-[95vw]">
            <Image src={mainImage} alt={title} fill sizes="95vw" className="rounded-2xl object-contain" />
          </div>
          {photos.length > 1 && <div className="absolute bottom-5 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-(--secondary-green)">{selectedPhotoIndex + 1} / {photos.length}</div>}
        </div>
      )}

      {reportModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-[520px] rounded-3xl border border-(--border-beige) bg-white p-6 shadow-2xl">
            <button type="button" onClick={() => setReportModalOpen(false)} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-(--border-beige) text-lg font-bold text-(--secondary-green) hover:bg-(--background)">×</button>
            {!reportSuccess ? (
              <>
                <h2 className="text-2xl font-extrabold text-(--secondary-green)">Report this listing</h2>
                <p className="mt-2 text-sm leading-6 text-(--muted-green-text)">Tell us what looks wrong. Reports help keep PawHome safer.</p>
                <form onSubmit={handleSubmitReport} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Reason</label>
                    <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm text-(--secondary-green) outline-none focus:border-(--primary-green)">
                      <option value="">Select a reason</option>
                      <option value="Suspicious seller">Suspicious seller</option>
                      <option value="Fake or misleading listing">Fake or misleading listing</option>
                      <option value="Animal welfare concern">Animal welfare concern</option>
                      <option value="Too young to leave mother">Too young to leave mother</option>
                      <option value="Microchip or paperwork issue">Microchip or paperwork issue</option>
                      <option value="Scam or payment request">Scam or payment request</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Details</label>
                    <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} maxLength={1000} rows={5} placeholder="Add any details that may help us review this listing." className="w-full resize-none rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm text-(--secondary-green) outline-none focus:border-(--primary-green)" />
                  </div>
                  <button type="submit" disabled={reportSubmitting} className="w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
                <h2 className="mt-5 text-2xl font-extrabold text-(--secondary-green)">Report submitted</h2>
                <p className="mt-2 text-sm leading-6 text-(--muted-green-text)">Thank you. We will review this listing.</p>
                <button type="button" onClick={() => setReportModalOpen(false)} className="mt-6 w-full rounded-xl bg-(--primary-green) px-5 py-3 text-sm font-bold text-white">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
