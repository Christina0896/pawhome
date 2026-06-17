'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../components/header';
import Footer from '../../../components/footer';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import {
  AgeIcon,
  ChipIcon,
  WormIcon,
  VaccineIcon,
  VetIcon,
  NeuteredIcon,
  HealthIcon,
  LitterIcon,
  AvailableIcon,
  BirthIcon,
  CalendarIcon,
  EyeIcon,
  PaperIcon,
  PawIcon,
  GroupIcon,
  LocationIcon,
  HeartIcon,
  FemaleIcon,
  MaleIcon,
  MixedGenderIcon,
  ShieldCheckIcon,
  PhoneIcon,
} from '../../../components/Icons';

const formatDate = (value, options) => {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('en-IE', options);
};
const getSexIcon = (sex) => {
  const value = sex?.toLowerCase();

  if (value === 'female') {
    return <FemaleIcon />;
  }

  if (value === 'male') {
    return <MaleIcon />;
  }

  if (value === 'mixed' || value === 'mixed litter' || value === 'mixed gender' || value === 'mixed genders') {
    return <MixedGenderIcon />;
  }

  return null;
};
const yesNo = (value) => {
  if (!value) return '-';
  if (value === 'Yes' || value === true) return 'Yes ✅';
  if (value === 'No' || value === false) return 'No ❌';

  return value;
};

const sortPhotos = (photos) => {
  return [...(photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
};

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = params.id;

  const handleShowPhoneNumber = async () => {
    if (!listing?.id) return;

    setPhoneVisible(true);

    const { data, error } = await supabase.rpc('increment_listing_phone_clicks', {
      listing_id_input: Number(listing.id),
    });

    if (error) {
      console.warn('Phone click tracking failed:', error);
      return;
    }

    setListing((current) => {
      if (!current) return current;

      return {
        ...current,
        phone_clicks: data ?? current.phone_clicks ?? 0,
      };
    });
  };

  const [listing, setListing] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const [similarListings, setSimilarListings] = useState([]);
  const InfoPill = ({ icon, text }) => {
    if (!text) return null;

    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-(--background) px-2.5 py-2 text-xs font-bold text-(--secondary-green)">
        <span className="flex h-4 w-4 items-center justify-center text-(--secondary-green)">{icon}</span>
        {text}
      </span>
    );
  };

  useEffect(() => {
    let isMounted = true;

    const loadListing = async () => {
      setLoading(true);
      setListing(null);
      setPhotos([]);
      setSelectedPhotoIndex(0);
      setPhoneVisible(false);

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
        .single();

      if (!isMounted) return;

      if (error || !data) {
        console.error('Listing fetch error:', error);
        setLoading(false);
        return;
      }

      const sortedPhotos = sortPhotos(data.listing_photos);

      setListing(data);
      setPhotos(sortedPhotos);
      setSelectedPhotoIndex(0);

      // Important: stop loading immediately after the listing itself is ready
      setLoading(false);

      // Everything below runs after the page is already visible

      const viewStorageKey = `pawhome-viewed-${data.id}`;

      if (!sessionStorage.getItem(viewStorageKey)) {
        sessionStorage.setItem(viewStorageKey, 'true');

        const { data: newViewCount, error: viewError } = await supabase.rpc('increment_listing_views', {
          listing_id_input: Number(data.id),
        });

        if (!viewError && isMounted) {
          setListing((current) => {
            if (!current) return current;

            return {
              ...current,
              views: newViewCount ?? current.views ?? 0,
            };
          });
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      setCurrentUser(user);

      if (user) {
        const { data: favouriteData } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('listing_id', listingId)
          .maybeSingle();

        if (isMounted) {
          setIsFavourite(Boolean(favouriteData));
        }
      }

      const { data: similarData, error: similarError } = await supabase
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
        .eq('status', 'approved')
        .neq('id', listingId)
        .or(`breed.eq.${data.breed},animal_type.eq.${data.animal_type}`)
        .limit(5);

      if (!isMounted) return;

      if (similarError) {
        console.warn('Similar listings not available:', similarError.message);
        setSimilarListings([]);
      } else {
        setSimilarListings(similarData || []);
      }
    };

    if (listingId) {
      loadListing();
    }

    return () => {
      isMounted = false;
    };
  }, [listingId]);

  const handlePreviousPhoto = () => {
    if (photos.length === 0) return;

    setSelectedPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    if (photos.length === 0) return;

    setSelectedPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleToggleFavourite = async () => {
    if (!currentUser) {
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }

    if (!listing) return;

    if (isFavourite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('listing_id', listing.id);

      if (error) {
        console.error('Remove favourite error:', error);
        return;
      }

      const newCount = Math.max((listing.favourites_count || 0) - 1, 0);

      await supabase.from('listings').update({ favourites_count: newCount }).eq('id', listing.id);

      setListing({
        ...listing,
        favourites_count: newCount,
      });

      setIsFavourite(false);
      return;
    }

    const { error } = await supabase.from('favorites').insert({
      user_id: currentUser.id,
      listing_id: listing.id,
    });

    if (error) {
      console.error('Add favourite error:', error);
      return;
    }

    const newCount = (listing.favourites_count || 0) + 1;

    await supabase.from('listings').update({ favourites_count: newCount }).eq('id', listing.id);

    setListing({
      ...listing,
      favourites_count: newCount,
    });

    setIsFavourite(true);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    alert('Listing link copied.');
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!listing) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }

    if (!reportReason) {
      alert('Please select a reason.');
      return;
    }

    setReportSubmitting(true);

    const { error } = await supabase.from('listing_reports').insert({
      listing_id: listing.id,
      reporter_user_id: user.id,
      reason: reportReason,
      details: reportDetails,
      status: 'open',
    });

    setReportSubmitting(false);

    if (error) {
      console.error('Report listing error:', error);
      alert('Could not submit report. Please try again.');
      return;
    }

    setReportSuccess(true);
    setReportReason('');
    setReportDetails('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--background)">
        <Header />

        <main className="mx-auto max-w-(--page-max-width) px-6 py-10">
          <p className="text-sm text-(--secondary-green)">Loading listing...</p>
        </main>

        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-(--background)">
        <Header />

        <main className="mx-auto max-w-(--page-max-width) px-6 py-10">
          <div className="rounded-3xl border border-(--border-beige) bg-white p-10 text-center">
            <h1 className="text-2xl font-extrabold text-(--secondary-green)">Listing not found</h1>

            <Link
              href="/listings"
              className="mt-6 inline-flex rounded-xl bg-(--primary-green) px-6 py-3 text-sm font-bold text-white"
            >
              Back to listings
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const title = listing.title || `${listing.breed || listing.animal_type || 'Pet'} available`;

  const subtitle = [listing.breed, listing.sex, listing.age, listing.county].filter(Boolean).join(' • ');

  const postedDate = listing.created_at
    ? formatDate(listing.created_at, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';

  const sellerMemberSince = listing.seller_member_since
    ? formatDate(listing.seller_member_since, {
        month: 'long',
        year: 'numeric',
      })
    : '-';

  const dateOfBirth = listing.date_of_birth
    ? formatDate(listing.date_of_birth, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : listing.dob || '-';

  const readyToLeave = listing.ready_to_leave
    ? formatDate(listing.ready_to_leave, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  const priceDisplay =
    listing.price !== null && listing.price !== undefined && listing.price !== ''
      ? `€${listing.price}`
      : listing.listing_type === 'For Adoption'
        ? 'No fee listed'
        : 'Price not listed';

  const mainImage = photos[selectedPhotoIndex]?.image_url || '/images/placeholder-pet.jpg';

  const locationTown =
    listing.town || listing.city || listing.city_town || listing.location_town || listing.location || '';

  const locationText = [locationTown, listing.county, 'Ireland'].filter(Boolean).join(', ');

  const listingTags = [listing.animal_type, listing.breed, listing.age, listing.sex, listing.county].filter(Boolean);
  const descriptionText = listing.description || 'No description provided.';
  const isLongDescription = descriptionText.length > 420;
  const healthItems = [
    { label: 'Current Age', value: listing.age || '-', icon: <AgeIcon /> },
    { label: 'Microchipped', value: yesNo(listing.microchipped), icon: <ChipIcon /> },
    { label: 'Wormed', value: yesNo(listing.wormed), icon: <WormIcon /> },
    { label: 'Vaccinated', value: yesNo(listing.vaccinated), icon: <VaccineIcon /> },
    { label: 'Vet Checked', value: yesNo(listing.vet_checked), icon: <VetIcon /> },
  ];

  const litterItems = [
    { label: 'Litter Size', value: listing.litter_size || '-', icon: <LitterIcon /> },
    {
      label: 'Available',
      value: listing.available_litter_count || '-',
      icon: <AvailableIcon />,
    },
    { label: 'Date of Birth', value: dateOfBirth, icon: <BirthIcon /> },
    { label: 'Ready to Leave', value: readyToLeave, icon: <CalendarIcon /> },
    {
      label: 'Mother Can Be Seen',
      value: yesNo(listing.mother_can_be_seen),
      icon: <EyeIcon />,
    },
    {
      label: 'Kennel Club Paperwork',
      value: yesNo(listing.kennel_club_registered),
      icon: <PaperIcon />,
    },
  ];

  const isMixedLitter =
    String(listing?.sex || '')
      .trim()
      .toLowerCase() === 'mixed litter';

  const maleCount = Number(listing?.male_count || 0);
  const femaleCount = Number(listing?.female_count || 0);

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-(--page-max-width) px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-(--muted-green-text)">
          <Link href="/" className="hover:text-(--primary-green)">
            Home
          </Link>

          <span>›</span>

          <Link href="/listings" className="hover:text-(--primary-green)">
            Listings
          </Link>

          <span>›</span>

          <span className="font-semibold text-(--secondary-green)">{title}</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Hero gallery card */}
            <section className="overflow-hidden rounded-3xl border border-(--border-beige) bg-white p-5 shadow-[0_14px_34px_rgba(18,53,36,0.08)]">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <h1 className="text-3xl font-extrabold leading-tight text-(--secondary-green) md:text-4xl">
                    {title}
                  </h1>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {listing.breed && <InfoPill icon={<PawIcon />} text={listing.breed} />}

                    {listing.sex && listing.sex !== 'Mixed Litter' && (
                      <InfoPill icon={getSexIcon(listing.sex)} text={listing.sex} />
                    )}

                    {listing.sex === 'Mixed Litter' && (
                      <>
                        <InfoPill
                          icon={<MaleIcon className="h-5 w-5 text-(--primary-green)" />}
                          text={`${listing.male_count || 0} boys`}
                        />

                        <InfoPill
                          icon={<FemaleIcon className="h-5 w-5 text-(--primary-green)" />}
                          text={`${listing.female_count || 0} girls`}
                        />
                      </>
                    )}

                    {listing.age && <InfoPill icon={<CalendarIcon />} text={listing.age} />}

                    {listing.county && <InfoPill icon={<LocationIcon />} text={listing.county} />}
                  </div>

                  <p className="flex items-center mt-2 font-bold text-xs text-(--muted-green-text)">
                    <span className="p-1">
                      <CalendarIcon />
                    </span>{' '}
                    Posted {postedDate}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-4 md:items-end">
                  <div className="text-left md:text-right">
                    <p className="text-3xl font-extrabold text-(--secondary-green)">{priceDisplay}</p>

                    {listing.price_negotiable && (
                      <p className="mt-1 text-sm font-bold text-(--primary-green)">Negotiable</p>
                    )}
                  </div>

                  <div className="flex gap-4 text-sm font-bold text-(--primary-green)">
                    <button type="button" onClick={handleCopyLink} className="hover:text-(--primary-orange)">
                      ↗ Share
                    </button>

                    <button type="button" onClick={handleToggleFavourite} className="hover:text-(--primary-orange)">
                      {isFavourite ? '♥ Saved' : '♡ Save'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="relative h-[280px] overflow-hidden rounded-3xl bg-(--light-green) sm:h-[420px] lg:h-[560px]">
                  <button
                    type="button"
                    onClick={() => setImageModalOpen(true)}
                    className="block h-full w-full cursor-zoom-in"
                  >
                    <img src={mainImage} alt={title} className="h-full w-full object-cover" />
                  </button>

                  {photos.length > 0 && (
                    <div className="absolute right-5 top-5 rounded-full bg-black/70 px-4 py-1.5 text-sm font-bold text-white">
                      {selectedPhotoIndex + 1}/{photos.length}
                    </div>
                  )}

                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePreviousPhoto}
                        className="absolute left-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-xl font-bold text-(--secondary-green) shadow-md transition hover:scale-105 hover:bg-(--primary-orange) hover:text-white"
                        aria-label="Previous photo"
                      >
                        ‹
                      </button>

                      <button
                        type="button"
                        onClick={handleNextPhoto}
                        className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-xl font-bold text-(--secondary-green) shadow-md transition hover:scale-105 hover:bg-(--primary-orange) hover:text-white"
                        aria-label="Next photo"
                      >
                        ›
                      </button>
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
                              selectedPhotoIndex === index
                                ? 'border-(--primary-orange)'
                                : 'border-white hover:border-(--border-beige)'
                            }`}
                            aria-label={`View photo ${index + 1}`}
                          >
                            <img
                              src={photo.image_url}
                              alt={`${title} photo ${index + 1}`}
                              className="h-full w-full object-cover"
                            />

                            {index === 3 && photos.length > 4 && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-extrabold text-white">
                                +{photos.length - 4}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Description + details side-by-side on large screens */}
            <div className="space-y-5">
              {/* About the Puppies */}
              <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[28px] font-extrabold leading-tight text-(--secondary-green)">Description</h2>

                    <div className="mt-4 text-[15px] leading-7 text-(--secondary-green)">
                      <div
                        className={`space-y-5 ${
                          isLongDescription && !descriptionExpanded ? 'max-h-[150px] overflow-hidden' : ''
                        }`}
                      >
                        {descriptionText
                          .split('\n')
                          .filter((paragraph) => paragraph.trim() !== '')
                          .map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
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
                          <span
                            key={tag}
                            className="rounded-full bg-(--background) px-3 py-1.5 text-xs font-bold text-(--secondary-green)"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Listing Details */}
              <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
                <div className="border-b border-(--border-beige) pb-4">
                  <h2 className="text-[28px] font-extrabold leading-tight text-(--secondary-green)">Listing Details</h2>

                  <p className="mt-1 text-sm text-(--muted-green-text)">
                    Health, documents, and background information provided by the seller.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-2">
                  <DetailGroup title="Health & Docs" items={healthItems} />

                  <DetailGroup
                    title={listing.sex === 'Mixed Litter' ? 'Litter Information' : 'Pet Background'}
                    items={litterItems}
                  />
                </div>
              </section>
            </div>

            {/* Similar ads */}
            <SimilarAds listings={similarListings} />
          </div>

          {/* Sidebar */}
          <aside className="h-fit space-y-5 lg:sticky lg:top-24">
            <SellerCard
              listing={listing}
              sellerMemberSince={sellerMemberSince}
              phoneVisible={phoneVisible}
              onShowPhoneNumber={handleShowPhoneNumber}
              setReportSuccess={setReportSuccess}
            />

            <SafetyCard />

            <LocationMap locationText={locationText} />

            <SaveReminder isFavourite={isFavourite} handleToggleFavourite={handleToggleFavourite} />
          </aside>
        </div>
      </main>

      {imageModalOpen && (
        <ImageLightbox
          title={title}
          mainImage={mainImage}
          photos={photos}
          selectedPhotoIndex={selectedPhotoIndex}
          setImageModalOpen={setImageModalOpen}
          handlePreviousPhoto={handlePreviousPhoto}
          handleNextPhoto={handleNextPhoto}
        />
      )}

      {reportModalOpen && (
        <ReportModal
          reportSuccess={reportSuccess}
          reportReason={reportReason}
          reportDetails={reportDetails}
          reportSubmitting={reportSubmitting}
          setReportModalOpen={setReportModalOpen}
          setReportReason={setReportReason}
          setReportDetails={setReportDetails}
          handleSubmitReport={handleSubmitReport}
        />
      )}

      <Footer />
    </div>
  );
}

const SellerCard = ({
  listing,
  sellerMemberSince,
  phoneVisible,
  onShowPhoneNumber,
  setReportModalOpen,
  setReportSuccess,
}) => {
  return (
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
          <SellerInfoRow label="Seller Type" value={listing.seller_type || '-'} />
          <SellerInfoRow label="Member Since" value={sellerMemberSince} />
          <SellerInfoRow label="County / Location" value={listing.county || '-'} />
        </div>

        <button
          type="button"
          onClick={onShowPhoneNumber}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-(--primary-orange) text-sm font-extrabold text-white transition hover:bg-(--secondary-orange)"
        >
          <span className="mx-2">
            <PhoneIcon />
          </span>{' '}
          {phoneVisible ? listing.contact_phone || listing.phone || 'Phone not provided' : 'Show Phone Number'}
        </button>
      </div>

      <div className="grid grid-cols-3 border-t border-(--border-beige) text-center text-xs">
        <div className="flex flex-col items-center  border-r border-(--border-beige) px-3 py-3">
          <span>
            <EyeIcon />
          </span>
          <p className="mt-0.5 font-extrabold text-(--secondary-green)">{listing.views || 0}</p>
          <p className=" text-(--muted-green-text)">views</p>
        </div>

        <div className="flex flex-col items-center border-r border-(--border-beige) px-3 py-3">
          <span>
            <HeartIcon />
          </span>
          <p className="mt-0.5 font-extrabold text-(--secondary-green)">{listing.favourites_count || 0}</p>
          <p className=" text-(--muted-green-text)">favourites</p>
        </div>

        <div className="flex flex-col items-center  px-3 py-3">
          <span>
            <PhoneIcon className="h-4" />
          </span>
          <p className="mt-1 font-extrabold text-(--secondary-green)">{listing.phone_clicks || 0}</p>
          <p className=" text-(--muted-green-text)">phone clicks</p>
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
  );
};

const SafetyCard = () => {
  const tips = [
    'Do not pay a deposit before seeing the pet in person.',
    'Dogs should not leave their mother before 8 weeks old.',
    'Ask to see the microchip certificate and seller ID.',
    'Meet at the seller’s home, not in a car park or public place.',
    'Bring a friend or family member when possible.',
  ];

  return (
    <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--light-green) text-lg">
          <ShieldCheckIcon />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-(--secondary-green)">Buying Safely</h2>

          <p className="mt-1 text-sm leading-6 text-(--muted-green-text)">
            Take basic checks before agreeing to buy or reserve a pet.
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-4 text-sm leading-6 text-(--secondary-green)">
        {tips.map((tip) => (
          <li key={tip} className="flex gap-3">
            <span className="font-bold text-(--primary-green)">✓</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/safety"
        className="mt-6 flex h-11 items-center justify-center rounded-xl border border-(--primary-green) text-sm font-bold text-(--primary-green) transition hover:bg-(--primary-green) hover:text-white"
      >
        Learn more about safe buying
      </Link>
    </section>
  );
};

const LocationMap = ({ locationText }) => {
  if (!locationText) return null;

  const mapUrl = `https://maps.google.com/maps?hl=en&q=${encodeURIComponent(locationText)}&z=11&t=m&output=embed`;

  return (
    <section className="rounded-3xl border border-(--border-beige) bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--background)">
          <LocationIcon />
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-(--secondary-green)">Location</h2>

          <p className="mt-1 text-sm font-semibold text-(--muted-green-text)">{locationText}</p>
        </div>
      </div>

      <div className="mt-1 h-[220px] overflow-hidden rounded-xl border border-(--border-beige)">
        <iframe
          title="Listing location map"
          src={mapUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-(--muted-green-text)">
        Approximate location only. The seller’s exact address is not shown.
      </p>
    </section>
  );
};

const SaveReminder = ({ isFavourite, handleToggleFavourite }) => {
  return (
    <section className="rounded-3xl border border-(--border-beige) bg-(--light-green) p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl text-(--primary-green)">
          <HealthIcon />
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-(--secondary-green)">Don’t miss out</h2>

          <p className="mt-1 text-sm text-(--muted-green-text)">Save this listing and keep it in your favourites.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggleFavourite}
        className="mt-5 w-full rounded-xl bg-(--primary-green) px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.02]"
      >
        {isFavourite ? 'Saved to favourites' : '♡ Save this listing'}
      </button>
    </section>
  );
};

const SimilarAds = ({ listings }) => {
  if (!listings || listings.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-(--secondary-green)">Similar Ads</h2>

        <Link href="/listings" className="text-sm font-bold text-(--primary-green) hover:text-(--primary-orange)">
          View all listings →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {listings.map((similar) => {
          const similarPhotos = sortPhotos(similar.listing_photos);
          const mainImage = similarPhotos[0]?.image_url;

          const similarTitle = similar.title || `${similar.breed || similar.animal_type || 'Pet'} available`;

          const postedDate = similar.created_at
            ? formatDate(similar.created_at, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : 'recently';

          return (
            <Link
              key={similar.id}
              href={`/listings/${similar.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-(--border-beige) bg-(--secondary-background) shadow-[0_6px_18px_rgba(18,53,36,0.07)] transition hover:-translate-y-1 hover:shadow-[0_10px_26px_rgba(18,53,36,0.11)]"
            >
              {/* Image */}
              <div className="relative h-[230px] overflow-hidden bg-(--light-green)">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={similarTitle}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-(--primary-green)">
                    <PawIcon className="h-12 w-12" />
                  </div>
                )}

                <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm">
                  <HeartIcon className="h-5 w-5 text-(--muted-green-text)" />
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col bg-(--secondary-background) p-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-1 text-lg font-extrabold tracking-tight text-(--primary-green)">
                    {similarTitle}
                  </h3>

                  {similar.price !== null && similar.price !== undefined && similar.price !== '' && (
                    <p className="shrink-0 text-lg font-extrabold text-(--primary-orange)">€{similar.price}</p>
                  )}
                </div>

                {/* Breed */}
                <div className="text-sm text-(--muted-green-text)">
                  <p className="mt-1 line-clamp-1 text-sm font-bold text-black">
                    {[similar.breed].filter(Boolean).join(' • ')}
                  </p>
                </div>

                {/* Listing details */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {similar.age && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-(--background) px-3 py-1 text-xs font-semibold text-(--primary-green)">
                      {similar.age}
                    </span>
                  )}

                  {similar.sex && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-(--background) px-3 py-1 text-xs font-semibold text-(--primary-green)">
                      <span className="text-sm leading-none">{getSexIcon(similar.sex)}</span>
                      {similar.sex}
                    </span>
                  )}

                  {similar.county && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-(--background) px-3 py-1 text-xs font-semibold text-(--primary-green)">
                      <LocationIcon className="h-3.5 w-3.5 text-(--primary-green)" />
                      {similar.county}
                    </span>
                  )}
                </div>

                {/* Posted date + IKC */}
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <div className="flex items-center gap-2 text-sm text-(--muted-green-text)">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Posted {postedDate}</span>
                  </div>

                  {['Yes', 'IKC Registered', 'KC Registered'].includes(similar.kennel_club_registered) && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--primary-green) text-[12px] font-extrabold text-white">
                      IKC
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

const DetailGroup = ({ title, items }) => {
  return (
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
};

const SellerInfoRow = ({ label, value }) => {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-(--muted-green-text)">{label}</span>

      <span className="text-right font-bold text-(--secondary-green)">{value}</span>
    </div>
  );
};

const ImageLightbox = ({
  title,
  mainImage,
  photos,
  selectedPhotoIndex,
  setImageModalOpen,
  handlePreviousPhoto,
  handleNextPhoto,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 px-4 py-6">
      <button
        type="button"
        onClick={() => setImageModalOpen(false)}
        className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-(--secondary-green)"
      >
        ×
      </button>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePreviousPhoto}
            className="absolute left-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-3xl font-bold text-(--secondary-green)"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={handleNextPhoto}
            className="absolute right-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-3xl font-bold text-(--secondary-green)"
          >
            ›
          </button>
        </>
      )}

      <img src={mainImage} alt={title} className="h-[90vh] w-[95vw] rounded-2xl object-contain" />

      {photos.length > 1 && (
        <div className="absolute bottom-5 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-(--secondary-green)">
          {selectedPhotoIndex + 1} / {photos.length}
        </div>
      )}
    </div>
  );
};

const ReportModal = ({
  reportSuccess,
  reportReason,
  reportDetails,
  reportSubmitting,
  setReportModalOpen,
  setReportReason,
  setReportDetails,
  handleSubmitReport,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-[520px] rounded-3xl border border-(--border-beige) bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => setReportModalOpen(false)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-(--border-beige) text-lg font-bold text-(--secondary-green) hover:bg-(--background)"
        >
          ×
        </button>

        {!reportSuccess ? (
          <>
            <h2 className="text-2xl font-extrabold text-(--secondary-green)">Report this listing</h2>

            <p className="mt-2 text-sm leading-6 text-(--muted-green-text)">
              Tell us what looks wrong. Reports help keep PawHome safer.
            </p>

            <form onSubmit={handleSubmitReport} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Reason</label>

                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm text-(--secondary-green) outline-none focus:border-(--primary-green)"
                >
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

                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={5}
                  placeholder="Add any details that may help us review this listing."
                  className="w-full resize-none rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm text-(--secondary-green) outline-none focus:border-(--primary-green)"
                />
              </div>

              <button
                type="submit"
                disabled={reportSubmitting}
                className="w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>

            <h2 className="mt-5 text-2xl font-extrabold text-(--secondary-green)">Report submitted</h2>

            <p className="mt-2 text-sm leading-6 text-(--muted-green-text)">Thank you. We will review this listing.</p>

            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="mt-6 w-full rounded-xl bg-(--primary-green) px-5 py-3 text-sm font-bold text-white"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
