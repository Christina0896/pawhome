'use client';

import React, { useState } from 'react';
import ContactModal from './ContactModal';
import Link from 'next/link';

const Footer = () => {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      <footer className="w-full bg-(--primary-green)">
        <div className="mx-auto grid max-w-[var(--page-max-width)] grid-cols-1 gap-8 px-6 py-10 md:grid-cols-2 lg:grid-cols-[260px_1fr_1fr_1fr_1fr]">
          <div>
            <img src="/img/logo.png" alt="PawHome Logo" className="h-16 w-auto object-contain" />
            <p className="mt-4 max-w-[230px] text-sm font-medium leading-6 text-white/80">
              Ireland&apos;s trusted platform to buy, sell and adopt pets responsibly.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-white">For Sale</h4>
            <div className="mt-4 space-y-2 text-sm font-medium text-white/80">
              <Link href="/dogs-for-sale" className="block hover:text-white">
                Dogs for Sale
              </Link>
              <Link href="/cats-for-sale" className="block hover:text-white">
                Cats for Sale
              </Link>
              <Link href="/other-pets-for-sale" className="block hover:text-white">
                Other Pets for Sale
              </Link>
              <Link href="/puppies-for-sale" className="block hover:text-white">
                Puppies for Sale
              </Link>
              <Link href="/kittens-for-sale" className="block hover:text-white">
                Kittens for Sale
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-white">For Adoption</h4>
            <div className="mt-4 space-y-2 text-sm font-medium text-white/80">
              <Link href="/dogs-for-adoption" className="block hover:text-white">
                Dogs for Adoption
              </Link>
              <Link href="/cats-for-adoption" className="block hover:text-white">
                Cats for Adoption
              </Link>
              <Link href="/other-pets-for-adoption" className="block hover:text-white">
                Other Pets for Adoption
              </Link>
              <Link href="/pets-for-adoption" className="block hover:text-white">
                Rescue Animals
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-white">Information</h4>
            <div className="mt-4 space-y-2 text-sm font-medium text-white/80">
              <Link href="/buying-safely" className="block hover:text-white">
                Pet Advice
              </Link>
              <Link href="/breed-guide" className="block hover:text-white">
                Breed Guide
              </Link>
              <Link href="/buying-safely" className="block hover:text-white">
                Safety Tips
              </Link>
              <Link href="/shelters" className="block hover:text-white">
                Shelters
              </Link>
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="block text-left hover:text-white"
              >
                Contact Us
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-white">Legal</h4>
            <div className="mt-4 space-y-2 text-sm font-medium text-white/80">
              <Link href="/terms" className="block hover:text-white">
                Terms of Use
              </Link>
              <Link href="/privacy" className="block hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="block hover:text-white">
                Cookie Policy
              </Link>
              <Link href="/guidelines" className="block hover:text-white">
                Guidelines
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-[var(--page-max-width)] flex-col gap-2 px-6 py-5 text-xs font-medium text-white/70 md:flex-row md:items-center md:justify-between">
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
