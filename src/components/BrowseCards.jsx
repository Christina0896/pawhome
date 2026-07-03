'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { ShieldCheckIcon, ArrowIcon, PawIcon, LocationIcon } from './Icons';

const FALLBACK_COUNTIES = ['Dublin', 'Galway', 'Cork', 'Limerick', 'Kerry', 'Mayo', 'Waterford', 'Meath', 'Wexford'];
const FALLBACK_BREEDS = ['Golden Retriever', 'Maine Coon', 'British Shorthair', 'Rabbits', 'Labrador', 'Cockapoo', 'German Shepherd', 'Ragdoll', 'Pomeranian'];

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
        .map(([label, count]) => ({ label, count })),
    );

    setBreedItems(
      Object.entries(breedCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 9)
        .map(([label, count]) => ({ label, count })),
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

  const countiesToShow = useMemo(() => {
    if (countyItems.length > 0) return countyItems;
    return FALLBACK_COUNTIES.map((label) => ({ label, count: null }));
  }, [countyItems]);

  const breedsToShow = useMemo(() => {
    if (breedItems.length > 0) return breedItems;
    return FALLBACK_BREEDS.map((label) => ({ label, count: null }));
  }, [breedItems]);

  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-4 pb-2">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BrowsePanel tone="green" icon={<LocationIcon className="h-8 w-8" />}>
          <h3 className="text-lg font-extrabold text-(--secondary-green)">Browse by County</h3>

          <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 text-[12px] font-semibold text-(--secondary-green)">
            {countiesToShow.map((item) => (
              <BrowseItem
                key={item.label}
                href={`/listings?county=${encodeURIComponent(item.label)}`}
                label={item.label}
                count={item.count}
              />
            ))}
          </div>

          <BrowseCta href="/listings" tone="green">
            View all counties
          </BrowseCta>
        </BrowsePanel>

        <BrowsePanel tone="orange" icon={<PawIcon className="h-8 w-8" />}>
          <h3 className="text-lg font-extrabold text-(--secondary-green)">Browse by Breed</h3>

          <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 text-[12px] font-semibold text-(--secondary-green)">
            {breedsToShow.map((item) => (
              <BrowseItem
                key={item.label}
                href={`/listings?breed=${encodeURIComponent(item.label)}`}
                label={item.label}
                count={item.count}
              />
            ))}
          </div>

          <BrowseCta href="/listings" tone="orange">
            View all breeds
          </BrowseCta>
        </BrowsePanel>

        <div className="flex min-h-[190px] items-center gap-5 overflow-hidden rounded-2xl border border-(--border-beige) bg-[#F4F5E8] px-6 py-5 shadow-[0_6px_18px_rgba(18,53,36,0.06)]">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#E2E5C7] text-(--primary-green)">
            <ShieldCheckIcon className="h-8 w-8" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold text-(--secondary-green)">Safety Tips</h3>

            <p className="mt-2 text-sm font-semibold leading-5 text-(--secondary-green)">
              Tips for meeting, buying and bringing your new pet home safely.
            </p>

            <BrowseCta href="/buying-safely" tone="green">
              Read our safety guide
            </BrowseCta>
          </div>
        </div>
      </div>
    </div>
  );
};

const BrowsePanel = ({ tone, icon, children }) => {
  const panelClass = tone === 'orange' ? 'bg-[#FFF4EA]' : 'bg-[#F2F3EC]';
  const iconClass = tone === 'orange' ? 'bg-(--primary-orange) text-white' : 'bg-[#DDE6D0] text-[#6F806F]';

  return (
    <div className={`flex min-h-[190px] items-center gap-5 rounded-2xl border border-(--border-beige) ${panelClass} px-6 py-5 shadow-[0_6px_18px_rgba(18,53,36,0.06)]`}>
      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
        {icon}
      </div>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

const BrowseItem = ({ href, label, count }) => {
  return (
    <Link href={href} title={label} className="flex min-w-0 items-center gap-1 transition hover:text-(--primary-orange)">
      <span className="min-w-0 truncate whitespace-nowrap">{label}</span>
      {count !== null && <span className="shrink-0 text-[11px] font-bold text-(--muted-green-text)">({count})</span>}
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
