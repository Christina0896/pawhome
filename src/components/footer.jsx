'use client';

import React, { useState } from 'react';
import ContactModal from './ContactModal';
import Link from 'next/link';

const Footer = () => {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      <footer className="w-full border-t border-(--border-beige) bg-(--background)">
        <div className="mx-auto grid max-w-[var(--page-max-width)] grid-cols-1 gap-8 px-6 py-10 md:grid-cols-2 lg:grid-cols-[260px_1fr_1fr_1fr_1fr]">
          <div>
            <img src="/img/logo.png" alt="PawHome Logo" className="h-16 w-auto object-contain" />
            <p className="mt-4 max-w-[230px] text-sm font-medium leading-6 text-(--muted-green-text)">
              Ireland&apos;s trusted platform to buy, sell and adopt pets responsibly.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-(--primary-green)">For Sale</h4>
            <div className="mt-4 space-y-2 text-sm font-medium text-(--secondary-green)">
              <Link href="/dogs-for-sale" className="block hover:text-(--primary-orange)">
                Dogs for Sale
              </Link>
              <Link href="/cats-for-sale" className="block hover:text-(--primary-orange)">
                Cats for Sale
              </Link>
              <Link href="/other-pets-for-sale" className="block hover:text-(--primary-orange)">
                Other Pets for Sale
              </Link>
              <Link href="/puppies-for-sale" className="block hover:text-(--primary-orange)">
                Puppies for Sale
              </Link>
              <Link href="/kittens-for-sale" className="block hover:text-(--primary-orange)">
                Kittens for Sale
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-(--primary-green)">For Adoption</h4>
            <div className="mt-4 space-y-2 text-sm font-medium text-(--secondary-green)">
              <Link href="/dogs-for-adoption" className="block hover:text-(--primary-orange)">
                Dogs for Adoption
              </Link>
              <Link href="/cats-for-adoption" className="block hover:text-(--primary-orange)">
                Cats for Adoption
              </Link>
              <Link href="/other-pets-for-adoption" className="block hover:text-(--primary-orange)">
                Other Pets for Adoption
              </Link>
              <Link href="/pets-for-adoption" className="block hover:text-(--primary-orange)">
                Rescue Animals
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-(--primary-green)">Information</h4>
            <div className="mt-4 space-y-2 text-sm font-medium text-(--secondary-green)">
              <Link href="/buying-safely" className="block hover:text-(--primary-orange)">
                Pet Advice
              </Link>
              <Link href="/breed-guide" className="block hover:text-(--primary-orange)">
                Breed Guide
              </Link>
              <Link href="/buying-safely" className="block hover:text-(--primary-orange)">
                Safety Tips
              </Link>
              <Link href="/shelters" className="block hover:text-(--primary-orange)">
                Shelters
              </Link>
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="block text-left hover:text-(--primary-orange)"
              >
                Contact Us
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-(--primary-green)">Legal</h4>
            <div className="mt-4 space-y-2 text-sm font-medium text-(--secondary-green)">
              <Link href="/terms" className="block hover:text-(--primary-orange)">
                Terms of Use
              </Link>
              <Link href="/privacy" className="block hover:text-(--primary-orange)">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="block hover:text-(--primary-orange)">
                Cookie Policy
              </Link>
              <Link href="/guidelines" className="block hover:text-(--primary-orange)">
                Guidelines
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-(--border-beige)">
          <div className="mx-auto flex max-w-[var(--page-max-width)] flex-col gap-2 px-6 py-5 text-xs font-medium text-(--muted-green-text) md:flex-row md:items-center md:justify-between">
            <p>© 2025 PawHome. All rights reserved.</p>
            <p>Made with 🐾 in Ireland</p>
          </div>
        </div>
      </footer>

      {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} />}
    </>
  );
};

export default Footer;
