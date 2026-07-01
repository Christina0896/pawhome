'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ContactModal from './ContactModal';
import LoginModal from './LoginModal';
import { HeartIcon } from './Icons';
import Link from 'next/link';

const Header = () => {
  const { user, authLoading, signOut } = useAuth();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Allow other components to open the login modal
  useEffect(() => {
    const openLoginModal = () => {
      setShowLoginModal(true);
    };

    window.addEventListener('open-login-modal', openLoginModal);

    return () => {
      window.removeEventListener('open-login-modal', openLoginModal);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleFavoritesClick = () => {
    setMobileMenuOpen(false);

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    window.location.href = '/favorites';
  };

  const handleLoginClick = () => {
    setMobileMenuOpen(false);
    setShowLoginModal(true);
  };

  const handlePostAdClick = () => {
    setMobileMenuOpen(false);

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    window.location.href = '/post-ad';
  };

  return (
    <>
      <header className=" top-0 z-999 border-b border-(--border-beige) bg-(--background)">
        <nav className="mx-auto flex h-16 max-w-(--page-max-width) items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="relative flex h-16 w-[142px] items-center md:h-15">
            <Image src="/img/logo.png" alt="PawHome Logo" fill priority sizes="142px" className="object-contain" />
          </Link>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-15 font-bold text-(--primary-green) lg:flex">
            <Link href="/shelters" className="inline-block transition duration-200 hover:scale-110">
              Shelters
            </Link>

            <Link href="/breed-guide" className="inline-block transition duration-200 hover:scale-110 ">
              Breed Guide
            </Link>

            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="inline-block transition duration-200 hover:scale-110 cursor-pointer"
            >
              Contact Us
            </button>
            <Link href="/about" className="inline-block transition duration-200 hover:scale-110 ">
              About Us
            </Link>
          </div>

          {/* Desktop right side */}
          <div className="hidden items-center gap-5 font-semibold text-(--primary-green) lg:flex">
            <button
              type="button"
              onClick={handleFavoritesClick}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-(--border-beige) text-xl hover:bg-(--light-green) "
            >
              <HeartIcon className="h-4 w-4 text-(--primary-green)" />
            </button>

            {authLoading ? (
              <div className="h-5 w-20 rounded " />
            ) : user ? (
              <>
                <Link
                  href="/profile"
                  className="inline-block font-bold text-(--primary-green) transition duration-200 hover:scale-110 cursor-pointer"
                >
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-block font-bold text-(--primary-green) transition duration-200 hover:scale-110 cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="inline-block font-bold text-(--primary-green) transition duration-200 hover:scale-110 cursor-pointer"
                >
                  Login
                </button>

                <Link
                  href="/register"
                  type="button"
                  className="inline-block font-bold text-(--primary-green) transition duration-200 hover:scale-110 cursor-pointer "
                >
                  Register
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={handlePostAdClick}
              className="rounded-xl bg-(--primary-green) px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-(--secondary-green)"
            >
              Post an Ad
            </button>
          </div>

          {/* Mobile right side */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={handleFavoritesClick}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-(--border-beige) text-xl "
            >
              <HeartIcon className="h-4 w-4 text-(--primary-green)" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--border-beige) text-xl text-(--primary-green)"
            >
              {mobileMenuOpen ? '×' : '☰'}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-(--border-beige) bg-white px-4 py-5 lg:hidden">
            <div className="mx-auto flex max-w-[1500px] flex-col gap-4 font-semibold text-(--primary-green)">
              <Link href="/shelters" onClick={() => setMobileMenuOpen(false)} className="">
                Shelters
              </Link>

              <Link href="/breed-guide" onClick={() => setMobileMenuOpen(false)} className="">
                Breed Guide
              </Link>

              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="">
                About Us
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowContactModal(true);
                  setMobileMenuOpen(false);
                }}
                className="text-left cursor-pointer"
              >
                Contact Us
              </button>

              <div className="h-px bg-(--border-beige)" />

              {authLoading ? (
                <div className="h-5 w-24 rounded " />
              ) : user ? (
                <>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="">
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-left "
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleLoginClick}
                    className="inline-block transition duration-200 hover:scale-110 cursor-pointer"
                  >
                    Login
                  </button>

                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl  bg-white px-4 py-3 text-center text-sm font-bold text-[var(--primary-green)] transition hover:border-[var(--primary-green)]"
                  >
                    Register
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={handlePostAdClick}
                className="mt-2 rounded-xl bg-(--primary-green) px-6 py-3 text-center text-sm font-bold text-white"
              >
                Post an Ad
              </button>
            </div>
          </div>
        )}
      </header>

      {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} />}

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
};

export default Header;
