'use client';

import React, { useEffect, useState } from 'react';
import ContactModal from './ContactModal';
import { supabase } from '../lib/supabaseClient';
import { ShieldCheckIcon, ArrowIcon, PawIcon } from './Icons';

const MapIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10">
    <path d="M15 9 6 13v26l9-4 18 4 9-4V9l-9 4-18-4Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M15 9v26M33 13v26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Footer = () => {
  const [topCounties, setTopCounties] = useState([]);
  const [topBreeds, setTopBreeds] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const fetchFooterData = async () => {
      const { data, error } = await supabase.from('listings').select('county, breed').eq('status', 'approved');

      if (error) {
        console.error('Footer fetch error:', error);
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

      const sortedCounties = Object.entries(countyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 9)
        .map(([county, count]) => ({ county, count }));

      const sortedBreeds = Object.entries(breedCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 9)
        .map(([breed, count]) => ({ breed, count }));

      setTopCounties(sortedCounties);
      setTopBreeds(sortedBreeds);
    };

    fetchFooterData();
  }, []);

  const countyItems = topCounties;
  const breedItems = topBreeds;

  return (
    <>
      <footer className=" w-full bg-(--background)">
        <div className="mx-auto max-w-[var(--page-max-width)] px-4 pb-15">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex min-h-[128px] items-center gap-6 rounded-2xl border border-(--border-beige) bg-white/70 px-6 py-5 shadow-[0_6px_18px_rgba(18,53,36,0.06)]">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#DDE6D0] text-[#8A9A7A]">
                <MapIcon />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-extrabold text-(--secondary-green)">Browse by County</h3>

                <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-semibold text-(--secondary-green) sm:grid-cols-3">
                  {countyItems.length > 0 ? (
                    countyItems.map((item) => (
                      <a
                        key={item.county}
                        href={`/listings?county=${encodeURIComponent(item.county)}`}
                        className="flex items-center truncate transition hover:text-(--primary-orange)"
                      >
                        <span className="truncate">{item.county}</span>
                        <span className="ml-1 text-xs font-bold text-(--muted-green-text)">({item.count})</span>
                      </a>
                    ))
                  ) : (
                    <p className="col-span-3 text-sm text-(--muted-green-text)">No counties yet</p>
                  )}
                </div>

                <a
                  href="/listings"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-(--primary-green) transition hover:text-(--primary-orange)"
                >
                  View all counties <ArrowIcon />
                </a>
              </div>
            </div>

            <div className="flex min-h-[128px] items-center gap-6 rounded-2xl border border-(--border-beige) bg-[#FFF4EA] px-6 py-5 shadow-[0_6px_18px_rgba(18,53,36,0.06)]">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-(--primary-orange) text-white">
                <PawIcon className="h-10 w-20 " />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-extrabold text-(--secondary-green)">Browse by Breed</h3>

                <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-semibold text-(--secondary-green) sm:grid-cols-3">
                  {breedItems.length > 0 ? (
                    breedItems.map((item) => (
                      <a
                        key={item.breed}
                        href={`/listings?breed=${encodeURIComponent(item.breed)}`}
                        className="flex items-center truncate transition hover:text-(--primary-orange)"
                      >
                        <span className="truncate">{item.breed}</span>
                        <span className="ml-1 text-xs font-bold text-(--muted-green-text)">({item.count})</span>
                      </a>
                    ))
                  ) : (
                    <p className="col-span-3 text-sm text-(--muted-green-text)">No breeds yet</p>
                  )}
                </div>

                <a
                  href="/listings"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-(--primary-orange) transition hover:text-(--secondary-orange)"
                >
                  View all breeds <ArrowIcon />
                </a>
              </div>
            </div>

            <div className="relative flex h-full min-h-[128px] items-center overflow-hidden rounded-2xl border border-(--border-beige) bg-[#F4F5E8] px-3.5 py-5 shadow-[0_6px_18px_rgba(18,53,36,0.06)]">
              <div className="z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#E2E5C7] text-(--primary-green)">
                <ShieldCheckIcon />
              </div>

              <div className="z-10 ml-6 max-w-[300px] pr-[75px]">
                <h3 className="text-lg font-extrabold text-(--secondary-green)">Safety Tips</h3>

                <p className="mt-2 text-sm font-semibold leading-5 text-(--secondary-green)">
                  Tips for meeting, buying and bringing your new pet home safely.
                </p>

                <a
                  href="/buying-safely"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-(--primary-green) transition hover:text-(--primary-orange)"
                >
                  Read our safety guide <ArrowIcon />
                </a>
              </div>

              <img
                className="pointer-events-none absolute bottom-1 right-1 hidden h-[100px] w-[140px] object-contain opacity-60 md:block"
                src="/img/miniLogo.png"
                alt=""
              />
            </div>
          </div>
        </div>

        <div className="bg-(--primary-green)">
          <div className="mx-auto grid max-w-[var(--page-max-width)] grid-cols-1 gap-8 px-10 py-7 text-white md:grid-cols-2 lg:grid-cols-[220px_minmax(420px,1.7fr)_150px_150px_240px]">
            <div>
              <img src="/img/logo.png" alt="PawHome Logo" className="h-20 w-auto object-contain md:h-25" />
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-white">About PawHome</h4>
              <p className="mt-4 max-w-[300px] text-sm font-medium leading-6 text-white/80">
                PawHome is Ireland&apos;s trusted pet marketplace connecting loving homes with wonderful pets.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-white">Quick Links</h4>
              <div className="mt-4 space-y-2 text-sm font-medium text-white/80">
                <a href="/listings" className="block hover:text-white">
                  Shelters
                </a>
                <a href="/breed-guide" className="block hover:text-white">
                  Breed Guide
                </a>
                <a href="/buying-safely" className="block hover:text-white">
                  Safety Tips
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-white">&nbsp;</h4>
              <div className="mt-4 space-y-2 text-sm font-medium text-white/80">
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="block text-left hover:text-white"
                >
                  Contact Us
                </button>
                <a href="/terms" className="block hover:text-white">
                  Terms of Use
                </a>
                <a href="/privacy" className="block hover:text-white">
                  Privacy Policy
                </a>
              </div>
            </div>

            <div>
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#4F8D63] bg-[#155F35] px-4 py-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-(--primary-green)">
                  <ShieldCheckIcon />
                </div>
                <p className=" text-xs font-extrabold leading-5 text-white">
                  Proudly supporting animal welfare in Ireland
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} />}
    </>
  );
};

export default Footer;
