'use client';

import React, { useEffect, useState } from 'react';
import ContactModal from './ContactModal';
import { supabase } from '../lib/supabaseClient';
import { ShieldCheckIcon, ArrowIcon, PawIcon } from './Icons';
import BrowseCards from './BrowseCards';
import Link from 'next/link';

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
        <BrowseCards />
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
                <Link href="/listings" className="block hover:text-white">
                  Shelters
                </Link>
                <Link href="/breed-guide" className="block hover:text-white">
                  Breed Guide
                </Link>
                <Link href="/buying-safely" className="block hover:text-white">
                  Safety Tips
                </Link>
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
                <Link href="/terms" className="block hover:text-white">
                  Terms of Use
                </Link>
                <Link href="/privacy" className="block hover:text-white">
                  Privacy Policy
                </Link>
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
