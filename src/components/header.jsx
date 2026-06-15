'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import ContactModal from './ContactModal';
import LoginModal from './LoginModal';

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
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#0e4f2a"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#000000"
                strokeWidth="0.00024"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0" />

                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />

                <g id="SVGRepo_iconCarrier">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.993 5.09691C11.0387 4.25883 9.78328 3.75 8.40796 3.75C5.42122 3.75 3 6.1497 3 9.10988C3 10.473 3.50639 11.7242 4.35199 12.67L12 20.25L19.4216 12.8944L19.641 12.6631C20.4866 11.7172 21 10.473 21 9.10988C21 6.1497 18.5788 3.75 15.592 3.75C14.2167 3.75 12.9613 4.25883 12.007 5.09692L12 5.08998L11.993 5.09691ZM12 7.09938L12.0549 7.14755L12.9079 6.30208L12.9968 6.22399C13.6868 5.61806 14.5932 5.25 15.592 5.25C17.763 5.25 19.5 6.99073 19.5 9.10988C19.5 10.0813 19.1385 10.9674 18.5363 11.6481L18.3492 11.8453L12 18.1381L5.44274 11.6391C4.85393 10.9658 4.5 10.0809 4.5 9.10988C4.5 6.99073 6.23699 5.25 8.40796 5.25C9.40675 5.25 10.3132 5.61806 11.0032 6.22398L11.0921 6.30203L11.9452 7.14752L12 7.09938Z"
                    fill="#0e4f2a"
                  />
                </g>
              </svg>
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
              <svg
                width="20px"
                height="20px"
                viewBox="0 0 24.00 24.00"
                fill="#0e4f2a"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#000000"
                strokeWidth="0.00024000000000000003"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0" />

                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />

                <g id="SVGRepo_iconCarrier">
                  {' '}
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.993 5.09691C11.0387 4.25883 9.78328 3.75 8.40796 3.75C5.42122 3.75 3 6.1497 3 9.10988C3 10.473 3.50639 11.7242 4.35199 12.67L12 20.25L19.4216 12.8944L19.641 12.6631C20.4866 11.7172 21 10.473 21 9.10988C21 6.1497 18.5788 3.75 15.592 3.75C14.2167 3.75 12.9613 4.25883 12.007 5.09692L12 5.08998L11.993 5.09691ZM12 7.09938L12.0549 7.14755L12.9079 6.30208L12.9968 6.22399C13.6868 5.61806 14.5932 5.25 15.592 5.25C17.763 5.25 19.5 6.99073 19.5 9.10988C19.5 10.0813 19.1385 10.9674 18.5363 11.6481L18.3492 11.8453L12 18.1381L5.44274 11.6391C4.85393 10.9658 4.5 10.0809 4.5 9.10988C4.5 6.99073 6.23699 5.25 8.40796 5.25C9.40675 5.25 10.3132 5.61806 11.0032 6.22398L11.0921 6.30203L11.9452 7.14752L12 7.09938Z"
                    fill="#0e4f2a"
                  />{' '}
                </g>
              </svg>
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
