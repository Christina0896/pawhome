'use client';

import { useEffect, useState } from 'react';
import ContactModal from './ContactModal';
import { supabase } from '../lib/supabaseClient';

const safetyTips = [
  {
    title: 'Meet pets in a public place',
    icon: '/svg/public-place.svg',
  },
  {
    title: 'Always see the pet with the owner',
    icon: '/svg/pet-owner.svg',
  },
  {
    title: 'Check microchip and registration',
    icon: '/svg/microchip.svg',
  },
  {
    title: 'Report suspicious listings',
    icon: '/svg/report.svg',
  },
];

const Footer = () => {
  // Footer data
  const [topCounties, setTopCounties] = useState([]);
  const [topBreeds, setTopBreeds] = useState([]);

  // UI state
  const [showContactModal, setShowContactModal] = useState(false);

  // Fetch top counties and breeds from approved listings
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
      <footer className="bg-(--background) px-4 pb-0 pt-10 sm:px-6">
        <div className="mx-auto max-w-(--page-max-width)">
          {/* Footer cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {/* Browse by County */}
            <FooterCard title="Browse by County">
              {topCounties.length === 0 ? (
                <p className="mt-4 text-sm text-(--muted-green-text)">No county listings yet.</p>
              ) : (
                <div className="mt-4 space-y-2 text-sm text-(--secondary-green)">
                  {topCounties.map((item) => (
                    <a
                      key={item.county}
                      href={`/listings?county=${encodeURIComponent(item.county)}`}
                      className="flex items-center justify-between gap-4 hover:text-(--primary-green) hover:underline"
                    >
                      <span>{item.county}</span>
                      <span className="text-xs text-(--muted-green-text)">{item.count}</span>
                    </a>
                  ))}
                </div>
              )}

              <a
                href="/listings"
                className="mt-6 inline-block text-sm font-bold text-(--primary-green) hover:text-(--primary-orange)"
              >
                View all counties →
              </a>
            </FooterCard>

            {/* Browse by Breed */}
            <FooterCard title="Browse by Breed">
              {topBreeds.length === 0 ? (
                <p className="mt-4 text-sm text-(--muted-green-text)">No breed listings yet.</p>
              ) : (
                <div className="mt-4 space-y-2 text-sm text-(--secondary-green)">
                  {topBreeds.map((item) => (
                    <a
                      key={item.breed}
                      href={`/listings?breed=${encodeURIComponent(item.breed)}`}
                      className="flex items-center justify-between gap-4 hover:text-(--primary-green) hover:underline"
                    >
                      <span>{item.breed}</span>
                      <span className="text-xs text-(--muted-green-text)">{item.count}</span>
                    </a>
                  ))}
                </div>
              )}

              <a
                href="/listings"
                className="mt-6 inline-block text-sm font-bold text-(--primary-green) hover:text-(--primary-orange)"
              >
                View all breeds →
              </a>
            </FooterCard>

            {/* Responsible Pet Buying */}
            <FooterCard title="Responsible Pet Buying">
              <p className="mt-4 text-sm leading-6 text-(--muted-green-text)">
                Follow our guide to help ensure you and your new pet have the best start together.
              </p>

              <a
                href="/BuyingSafely"
                className="mt-5 inline-flex items-center justify-center rounded-xl border border-(--primary-green) px-5 py-2.5 text-sm font-bold text-(--primary-green) transition hover:bg-(--primary-green) hover:text-white"
              >
                Read the Guide
              </a>
            </FooterCard>

            {/* Safety */}
            <div className="rounded-2xl bg-(--primary-green) p-6 text-white shadow-[0_8px_24px_rgba(18,53,36,0.10)]">
              <h3 className="text-lg font-bold">Safety First, Always</h3>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {safetyTips.map((tip) => (
                  <div key={tip.title} className="flex  gap-3">
                    <img src={tip.icon} alt="" className="mt-0.5 h-6 w-6 shrink-0 opacity-90" />

                    <p className=" text-sm font-medium leading-5 text-white/90">{tip.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="mt-8 border-t border-(--border-beige) py-5">
            <div className="flex flex-col items-center justify-between gap-4 text-sm text-(--muted-green-text) md:flex-row">
              <p>© {new Date().getFullYear()} PawHome. All rights reserved.</p>

              <div className="flex flex-wrap items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="cursor-pointer hover:text-(--primary-green)"
                >
                  Contact Us
                </button>

                <a href="/terms" className="hover:text-(--primary-green)">
                  Terms & Conditions
                </a>

                <a href="/AboutUs" className="hover:text-(--primary-green)">
                  About Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} />}
    </>
  );
};

const FooterCard = ({ title, children }) => {
  return (
    <div className="rounded-2xl border border-(--border-beige) bg-(--secondary-background) p-6 shadow-[0_8px_24px_rgba(18,53,36,0.06)]">
      <h3 className="text-lg font-bold text-(--secondary-green)">{title}</h3>

      {children}
    </div>
  );
};

export default Footer;
