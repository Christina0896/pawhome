import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Header from '../../../components/header';
import Footer from '../../../components/footer';
import { PUBLIC_LISTING_SELECT } from '../../../lib/publicListingSelect';
import ListingDetailClient from './ListingDetailClient';

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getListing(listingId) {
  const supabase = getSupabaseServerClient();

  if (!supabase || !listingId) {
    return { listing: null, similarListings: [] };
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .select(PUBLIC_LISTING_SELECT)
    .eq('id', listingId)
    .eq('status', 'approved')
    .maybeSingle();

  if (error) {
    console.error('Server listing detail fetch failed:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return { listing: null, similarListings: [] };
  }

  if (!listing) {
    return { listing: null, similarListings: [] };
  }

  const { data: similarListings, error: similarError } = await supabase
    .from('listings')
    .select(PUBLIC_LISTING_SELECT)
    .eq('status', 'approved')
    .neq('id', listingId)
    .eq('animal_type', listing.animal_type)
    .order('created_at', { ascending: false })
    .limit(3);

  if (similarError) {
    console.warn('Server similar listings fetch failed:', {
      message: similarError.message,
      code: similarError.code,
    });
  }

  return {
    listing,
    similarListings: similarListings || [],
  };
}

function ListingUnavailable() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[700px] flex-col items-center justify-center px-6 text-center">
      <div className="rounded-3xl border border-[var(--border-beige)] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[var(--secondary-green)]">This ad is no longer available</h1>

        <p className="mt-4 text-sm leading-6 text-[var(--muted-green-text)]">
          This ad may have been removed, expired, or is currently under review.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/listings"
            className="rounded-full bg-[var(--primary-orange)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--secondary-orange)]"
          >
            Browse available pets
          </Link>

          <Link
            href="/"
            className="rounded-full border border-[var(--border-beige)] bg-white px-6 py-3 text-sm font-bold text-[var(--secondary-green)] transition hover:border-[var(--primary-green)]"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function ListingDetailPage({ params }) {
  const resolvedParams = await params;
  const listingId = resolvedParams?.id;
  const { listing, similarListings } = await getListing(listingId);

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      {listing ? <ListingDetailClient listing={listing} similarListings={similarListings} /> : <ListingUnavailable />}

      <Footer />
    </div>
  );
}
