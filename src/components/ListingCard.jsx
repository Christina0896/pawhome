'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimalTypeIcon, CalendarIcon, FemaleIcon, HeartIcon, LocationIcon, MaleIcon, MixedGenderIcon, PawIcon } from './Icons';

function formatDate(date) {
  if (!date) return 'recently';

  return new Date(date).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getMainImage(photos) {
  const sortedPhotos = [...(photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return sortedPhotos[0]?.image_url;
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

function getPriceDisplay(listing) {
  if (listing?.price !== null && listing?.price !== undefined && listing?.price !== '') {
    return `€${listing.price}`;
  }

  if (listing?.listing_type === 'For Adoption') {
    return 'Adoption';
  }

  return '';
}

function getAnimalPillLabel(listing) {
  if (!listing) return '';

  if (listing.animal_type === 'Other Pets') {
    return listing.breed || 'Other Pet';
  }

  return listing.animal_type || listing.breed || '';
}

function InfoPill({ icon, children }) {
  if (!children) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-(--background) px-3 py-1 text-xs font-semibold text-(--primary-green)">
      {icon && <span className="text-(--primary-green)">{icon}</span>}
      {children}
    </span>
  );
}

export default function ListingCard({
  listing,
  isFavorite = false,
  showFavorite = true,
  onFavoriteClick,
  showDescription = true,
  compact = false,
}) {
  if (!listing) return null;

  const title = listing.title || `${listing.breed || listing.animal_type || 'Pet'} available`;
  const mainImage = getMainImage(listing.listing_photos);
  const priceDisplay = getPriceDisplay(listing);
  const animalPillLabel = getAnimalPillLabel(listing);

  const handleFavoriteClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (onFavoriteClick) {
      onFavoriteClick(event, listing.id);
    }
  };

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-(--border-beige) bg-(--secondary-background) shadow-[0_6px_18px_rgba(18,53,36,0.07)] transition hover:-translate-y-1 hover:shadow-[0_10px_26px_rgba(18,53,36,0.11)]"
    >
      <div className={`relative overflow-hidden bg-(--light-green) ${compact ? 'h-48' : 'h-[230px]'}`}>
        {mainImage ? (
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes={compact ? '(max-width: 768px) 100vw, 25vw' : '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-(--primary-green)">
            <PawIcon className="h-12 w-12" />
          </div>
        )}

        {showFavorite && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-110"
            aria-label={isFavorite ? 'Remove saved listing' : 'Save listing'}
          >
            <HeartIcon
              filled={isFavorite}
              className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-(--muted-green-text)'}`}
            />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col bg-(--secondary-background) p-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-lg font-extrabold tracking-tight text-(--primary-green)">{title}</h3>

          {priceDisplay && <p className="shrink-0 text-lg font-extrabold text-(--primary-orange)">{priceDisplay}</p>}
        </div>

        <div className="text-sm text-(--muted-green-text)">
          <p className="mt-1 line-clamp-1 text-sm font-bold text-black">
            {[listing.breed || listing.animal_type].filter(Boolean).join(' • ')}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {animalPillLabel && (
            <InfoPill
              icon={
                <AnimalTypeIcon
                  animalType={listing.animal_type}
                  category={listing.breed}
                  className="h-3.5 w-3.5"
                />
              }
            >
              {animalPillLabel}
            </InfoPill>
          )}

          {listing.age && (
            <InfoPill icon={<CalendarIcon className="h-3.5 w-3.5 text-(--primary-green)" />}>
              {listing.age}
            </InfoPill>
          )}

          {listing.sex && (
            <InfoPill icon={<span className="text-sm leading-none">{getSexIcon(listing.sex)}</span>}>
              {listing.sex}
            </InfoPill>
          )}

          {listing.county && (
            <InfoPill icon={<LocationIcon className="h-3.5 w-3.5 text-(--primary-green)" />}>
              {listing.county}
            </InfoPill>
          )}
        </div>

        {showDescription && listing.description && (
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-(--muted-green-text)">{listing.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div className="flex items-center gap-2 text-sm text-(--muted-green-text)">
            <CalendarIcon className="h-4 w-4" />
            <span>Posted {formatDate(listing.created_at)}</span>
          </div>

          {['Yes', 'IKC Registered', 'KC Registered'].includes(listing.kennel_club_registered) && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--primary-green) text-[12px] font-extrabold text-white">
              IKC
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
