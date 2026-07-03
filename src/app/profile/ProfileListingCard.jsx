import Link from 'next/link';

export default function ProfileListingCard({ listing, onDelete }) {
  const photo = listing?.listing_photos?.[0]?.image_url || '';

  return (
    <article className="overflow-hidden rounded-2xl border border-(--border-beige) bg-(--background) shadow-sm">
      <div className="h-40 bg-(--light-green)">
        {photo ? <img src={photo} alt={listing.title || 'Listing photo'} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-extrabold text-(--secondary-green)">{listing.title}</h3>
          <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-extrabold text-orange-700">{listing.status || 'pending'}</span>
        </div>
        <p className="text-sm font-bold text-(--primary-green)">€{listing.price || 'Contact'}</p>
        <p className="text-xs font-semibold text-(--muted-green-text)">{listing.breed} · {listing.county}</p>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link href={`/listings/${listing.id}?ownerPreview=true`} className="rounded-xl border border-(--border-beige) bg-white px-3 py-2 text-center text-xs font-bold text-(--secondary-green)">Preview</Link>
          <Link href={`/profile/listings/${listing.id}/edit`} className="rounded-xl bg-(--primary-green) px-3 py-2 text-center text-xs font-bold text-white">Edit</Link>
          <button type="button" onClick={() => onDelete(listing.id)} className="col-span-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600">Delete listing</button>
        </div>
      </div>
    </article>
  );
}
