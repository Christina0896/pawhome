'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import ContactModal from './ContactModal';
import { supabase } from '../lib/supabaseClient';

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
        .slice(0, 5)
        .map(([county, count]) => ({ county, count }));

      const sortedBreeds = Object.entries(breedCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([breed, count]) => ({ breed, count }));

      setTopCounties(sortedCounties);
      setTopBreeds(sortedBreeds);
    };

    fetchFooterData();
  }, []);
  return (
    <>
      <footer className="mx-auto max-w-[1500px]  ">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* Browse by County */}
          <div className="rounded-2xl border border-[#E8DFD1] bg-white/70 p-6">
            <h3 className="text-lg font-bold text-[#123524]">Browse by County</h3>

            {topCounties.length === 0 ? (
              <p className="mt-4 text-sm text-[#5F6F64]">No county listings yet.</p>
            ) : (
              <div className="mt-4 space-y-2 text-sm text-[#123524]">
                {topCounties.map((item) => (
                  <a
                    key={item.county}
                    href={`/listings?county=${encodeURIComponent(item.county)}`}
                    className="flex items-center justify-between gap-4 hover:text-[#0E4F2A] hover:underline"
                  >
                    <span>{item.county}</span>
                    <span className="text-xs text-[#5F6F64]">{item.count}</span>
                  </a>
                ))}
              </div>
            )}

            <a href="/listings" className="mt-6 inline-block text-sm font-bold text-[#0E4F2A] hover:underline">
              View all counties
            </a>
          </div>

          {/* Browse by Breed */}
          <div className="rounded-xl border border-[#EFE5D6] bg-[#FFFCF5] p-5">
            <h2 className=" font-semibold text-[#123524]">Browse by Breed</h2>

            {topBreeds.length === 0 ? (
              <p className="mt-4 text-sm text-[#5F6F64]">No breed listings yet.</p>
            ) : (
              <div className="mt-4 space-y-2 text-sm text-[#123524]">
                {topBreeds.map((item) => (
                  <a
                    key={item.breed}
                    href={`/listings?breed=${encodeURIComponent(item.breed)}`}
                    className="flex items-center justify-between gap-4 hover:text-[#0E4F2A] hover:underline"
                  >
                    <span>{item.breed}</span>
                    <span className="text-xs text-[#5F6F64]">{item.count}</span>
                  </a>
                ))}
              </div>
            )}
            <a href="/listings" className="mt-6 inline-block text-sm font-bold text-[#0E4F2A] hover:underline">
              View all breeds
            </a>
          </div>

          {/* Responsible Pet Buying */}
          <div className="rounded-xl border border-[#EFE5D6] bg-[#FFFCF5] p-5">
            <h2 className=" font-semibold text-[#123524]">Responsible Pet Buying</h2>

            <p className="mt-3 text-sm leading-6 text-[#123524]">
              Follow our guide to help ensure you and your new pet have the best start together.
            </p>

            <a
              href="/buying-safely"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-(--primary-green) px-6 py-3 text-sm font-bold text-white transition hover:scale-105 hover:bg-[#0A3B20]"
            >
              Read the Guide
            </a>
          </div>

          {/* Safety */}
          <div className="rounded-xl bg-[#0E4F2A] p-5 text-white">
            <h2 className=" font-semibold">Safety First, Always</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <img src="/svg/public-place.svg" alt="" />
                <p className="text-sm font-medium">Meet pets in a public place</p>
              </div>

              <div className="flex items-start gap-3">
                <img src="/svg/pet-owner.svg" alt="" />
                <p className="text-sm font-medium">Always see the pet with the owner</p>
              </div>

              <div className="flex items-start gap-3">
                <img src="/svg/microchip.svg" alt="" />
                <p className="text-sm font-medium">Check microchip and registration</p>
              </div>

              <div className="flex items-start gap-3">
                <img src="/svg/report.svg" alt="" />
                <p className="text-sm font-medium">Report suspicious listings</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-[#E8DFD1] bg-[#FAF6EC] px-6 py-5">
          <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-4 text-sm text-[#5F6F64] md:flex-row">
            <p>© {new Date().getFullYear()} PawHome. All rights reserved.</p>

            <div className="flex flex-wrap items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="hover:text-[#0E4F2A] cursor-pointer"
              >
                Contact Us
              </button>
              <a href="/terms" className="hover:text-[#0E4F2A]">
                Terms & Conditions
              </a>
              <a href="/AboutUs" className="hover:text-[#0E4F2A]">
                About Us
              </a>
            </div>
          </div>
        </div>
      </footer>
      {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} />}
    </>
  );
};

export default Footer;
