'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { ShieldCheckIcon, ArrowIcon, PawIcon } from './Icons';

const BrowseCards = () => {
  const [countyItems, setCountyItems] = useState([]);
  const [breedItems, setBreedItems] = useState([]);

  const fetchBrowseData = useCallback(async () => {
    const { data, error } = await supabase.from('listings').select('county, breed').eq('status', 'approved');

    if (error) {
      console.warn('Footer browse data error:', error);
      setCountyItems([]);
      setBreedItems([]);
      return;
    }

    const countyCounts = {};
    const breedCounts = {};

    (data || []).forEach((listing) => {
      if (listing.county) {
        countyCounts[listing.county] = (countyCounts[listing.county] || 0) + 1;
      }

      if (listing.breed) {
        breedCounts[listing.breed] = (breedCounts[listing.breed] || 0) + 1;
      }
    });

    setCountyItems(
      Object.entries(countyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 9)
        .map(([county, count]) => ({ county, count })),
    );

    setBreedItems(
      Object.entries(breedCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 9)
        .map(([breed, count]) => ({ breed, count })),
    );
  }, []);

  useEffect(() => {
    fetchBrowseData();

    const handlePageShow = () => {
      fetchBrowseData();
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [fetchBrowseData]);

  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-4 pb-2">
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className="flex h-full min-h-[128px] items-center gap-6 rounded-2xl border border-(--border-beige) bg-white/70 px-6 py-5 shadow-[0_6px_18px_rgba(18,53,36,0.06)]">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#DDE6D0] ">
            <span
              aria-hidden="true"
              style={{
                display: 'block',
                width: '48px',
                height: '48px',
                backgroundColor: '#8A9A7A',
                WebkitMask: "url('/svg/ireland.svg') center / contain no-repeat",
                mask: "url('/svg/ireland.svg') center / contain no-repeat",
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold text-(--secondary-green)">Browse by County</h3>

            <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 text-sm font-semibold text-(--secondary-green) sm:grid-cols-2">
              {countyItems.length > 0 ? (
                countyItems.map((item) => (
                  <Link
                    key={item.county}
                    href={`/listings?county=${encodeURIComponent(item.county)}`}
                    className="flex items-center transition hover:text-(--primary-orange)"
                  >
                    <span>{item.county}</span>
                    <span className="ml-1 text-xs font-bold text-(--muted-green-text)">({item.count})</span>
                  </Link>
                ))
              ) : (
                <p className="col-span-2 text-sm text-(--muted-green-text)">No counties yet</p>
              )}
            </div>

            <Link
              href="/listings"
              className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-(--primary-green) transition hover:text-(--primary-orange)"
            >
              View all counties <ArrowIcon />
            </Link>
          </div>
        </div>

        <div className="flex h-full min-h-[128px] items-center gap-6 rounded-2xl border border-(--border-beige) bg-[#FFF4EA] px-6 py-5 shadow-[0_6px_18px_rgba(18,53,36,0.06)]">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-(--primary-orange) text-white">
            <PawIcon className="h-9 w-9" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold text-(--secondary-green)">Browse by Breed</h3>

            <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 text-sm font-semibold text-(--secondary-green) sm:grid-cols-2">
              {breedItems.length > 0 ? (
                breedItems.map((item) => (
                  <Link
                    key={item.breed}
                    href={`/listings?breed=${encodeURIComponent(item.breed)}`}
                    className="flex items-center transition hover:text-(--primary-orange)"
                  >
                    <span>{item.breed}</span>
                    <span className="ml-1 text-xs font-bold text-(--muted-green-text)">({item.count})</span>
                  </Link>
                ))
              ) : (
                <p className="col-span-2 text-sm text-(--muted-green-text)">No breeds yet</p>
              )}
            </div>

            <Link
              href="/listings"
              className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-(--primary-orange) transition hover:text-(--secondary-orange)"
            >
              View all breeds <ArrowIcon />
            </Link>
          </div>
        </div>

        <div className="relative flex h-full min-h-[128px] items-center overflow-hidden rounded-2xl border border-(--border-beige) bg-[#F4F5E8] px-6 py-5 shadow-[0_6px_18px_rgba(18,53,36,0.06)]">
          <div className="z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#E2E5C7] text-(--primary-green)">
            <ShieldCheckIcon className="h-10 w-10" />
          </div>

          <div className="z-10 ml-6 max-w-[300px] pr-[130px]">
            <h3 className="text-lg font-extrabold text-(--secondary-green)">Safety Tips</h3>

            <p className="mt-2 text-sm font-semibold leading-5 text-(--secondary-green)">
              Tips for meeting, buying and bringing your new pet home safely.
            </p>

            <Link
              href="/buying-safely"
              className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-(--primary-green) transition hover:text-(--primary-orange)"
            >
              Read our safety guide <ArrowIcon />
            </Link>
          </div>

          <img
            className="pointer-events-none absolute bottom-0 right-4 hidden h-[105px] w-[145px] object-contain opacity-80 md:block"
            src="/img/miniLogo.png"
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

export default BrowseCards;
