'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import ContactModal from './ContactModal';
import LoginModal from './LoginModal';
import { HeartIcon } from './Icons';

const Header = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setAuthLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  const handleFavoritesClick = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

  const handleRegisterClick = () => {
    setMobileMenuOpen(false);
    window.location.href = '/login?mode=register';
  };

  const handlePostAdClick = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
          <a href="/" className="flex items-center">
            <img src="/img/logo.png" alt="PawHome Logo" className="h-16 w-auto object-contain md:h-15" />
          </a>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-15 font-bold text-(--primary-green) lg:flex">
            <a href="/shelters" className="inline-block transition duration-200 hover:scale-110">
              Shelters
            </a>

            <a href="/BreedGuide" className="inline-block transition duration-200 hover:scale-110 ">
              Breed Guide
            </a>

            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="inline-block transition duration-200 hover:scale-110 cursor-pointer"
            >
              Contact Us
            </button>
            <a href="/AboutUs" className="inline-block transition duration-200 hover:scale-110 ">
              About Us
            </a>
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
                <a
                  href="/profile"
                  className="inline-block font-bold text-(--primary-green) transition duration-200 hover:scale-110 cursor-pointer"
                >
                  Profile
                </a>

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

                <a
                  href="/register"
                  type="button"
                  onClick={handleRegisterClick}
                  className="inline-block font-bold text-(--primary-green) transition duration-200 hover:scale-110 cursor-pointer "
                >
                  Register
                </a>
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
              <a href="/shelters" onClick={() => setMobileMenuOpen(false)} className="">
                Shelters
              </a>

              <a href="/BuyingSafely" onClick={() => setMobileMenuOpen(false)} className="">
                Buying Safely
              </a>

              <a href="/BreedGuide" onClick={() => setMobileMenuOpen(false)} className="">
                Breed Guide
              </a>

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
                  <a href="/profile" onClick={() => setMobileMenuOpen(false)} className="">
                    Profile
                  </a>

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

                  <a
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl  bg-white px-4 py-3 text-center text-sm font-bold text-[var(--primary-green)] transition hover:border-[var(--primary-green)]"
                  >
                    Register
                  </a>
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
