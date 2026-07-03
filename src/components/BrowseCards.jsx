'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { ShieldCheckIcon, ArrowIcon, PawIcon, LocationIcon } from './Icons';

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
        .slice(0, 6)
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr_1fr]">
        <BrowseCard variant="green" icon={<LocationIcon className="h-9 w-9" />} iconTone="muted">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold text-(--secondary-green)">Browse by County</h3>

            <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-[12px] font-semibold text-(--secondary-green) sm:grid-cols-3">
              {countyItems.length > 0 ? (
                countyItems.map((item) => (
                  <BrowseLink key={item.county} href={`/listings?county=${encodeURIComponent(item.county)}`} label={item.county} count={item.count} />
                ))
              ) : (
                <p className="col-span-full text-sm text-(--muted-green-text)">No counties yet</p>
              )}
            </div>

            <BrowseCta href="/listings" tone="green">
              View all counties
            </BrowseCta>
          </div>
        </BrowseCard>

        <BrowseCard variant="orange" icon={<PawIcon className="h-7 w-7" />} iconTone="orange">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold text-(--secondary-green)">Browse by Breed</h3>

            <div className="mt-3 grid grid-cols-1 gap-y-2 text-[12px] font-semibold text-(--secondary-green) sm:grid-cols-2 sm:gap-x-5">
              {breedItems.length > 0 ? (
                breedItems.map((item) => (
                  <BrowseLink key={item.breed} href={`/listings?breed=${encodeURIComponent(item.breed)}`} label={item.breed} count={item.count} />
                ))
              ) : (
                <p className="col-span-full text-sm text-(--muted-green-text)">No breeds yet</p>
              )}
            </div>

            <BrowseCta href="/listings" tone="orange">
              View all breeds
            </BrowseCta>
          </div>
        </BrowseCard>

        <div className="relative overflow-hidden rounded-2xl border border-(--border-beige) bg-[#F4F5E8] px-6 py-6 shadow-[0_6px_18px_rgba(18,53,36,0.06)]">
          <div className="relative z-10 flex min-h-[180px] flex-col justify-between gap-5 sm:flex-row sm:items-center lg:min-h-[210px]">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#E2E5C7] text-(--primary-green)">
              <ShieldCheckIcon className="h-8 w-8" />
            </div>

            <div className="min-w-0 flex-1 sm:max-w-[210px]">
              <h3 className="text-lg font-extrabold text-(--secondary-green)">Safety Tips</h3>

              <p className="mt-2 text-sm font-semibold leading-5 text-(--secondary-green)">
                Tips for meeting, buying and bringing your new pet home safely.
              </p>

              <BrowseCta href="/buying-safely" tone="green">
                Read our safety guide
              </BrowseCta>
            </div>
          </div>

          <img
            className="pointer-events-none absolute bottom-2 right-4 hidden h-[92px] w-[128px] object-contain opacity-80 xl:block"
            src="/img/miniLogo.png"
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

const BrowseCard = ({ variant, icon, iconTone, children }) => {
  const bgClass = variant === 'orange' ? 'bg-[#FFF4EA]' : 'bg-[#F2F3EC]';
  const iconClass = iconTone === 'orange' ? 'bg-(--primary-orange) text-white' : 'bg-[#DDE6D0] text-[#6F806F]';

  return (
    <div className={`flex min-h-[210px] items-center gap-6 rounded-2xl border border-(--border-beige) ${bgClass} px-6 py-6 shadow-[0_6px_18px_rgba(18,53,36,0.06)]`}>
      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${iconClass}`}>{icon}</div>
      {children}
    </div>
  );
};

const BrowseLink = ({ href, label, count }) => {
  return (
    <Link href={href} title={label} className="flex min-w-0 items-center gap-1 transition hover:text-(--primary-orange)">
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 text-[11px] font-bold text-(--muted-green-text)">({count})</span>
    </Link>
  );
};

const BrowseCta = ({ href, tone, children }) => {
  const colorClass = tone === 'orange' ? 'text-(--primary-orange) hover:text-(--secondary-orange)' : 'text-(--primary-green) hover:text-(--primary-orange)';

  return (
    <Link href={href} className={`mt-4 inline-flex items-center gap-2 text-sm font-extrabold transition ${colorClass}`}>
      {children} <ArrowIcon className="h-3.5 w-3.5" />
    </Link>
  );
};

export default BrowseCards;
