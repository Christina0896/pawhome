'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Header = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <header className="w-full border-b border-[#E8DFD1] bg-white">
      <nav className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-2">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img src="/img/logo.png" alt="PawHome Logo" className="h-20 w-auto object-contain" />
        </a>

        {/* Navigation */}
        <div className="flex items-center gap-14 font-semibold text-[#123524]">
          <a href="/listings">Dogs</a>
          <a href="/listings">Cats</a>
          <a href="/listings">Other Pets</a>
          <a href="/breeders">Breeders</a>
          <a href="/shelters">Shelters</a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <a
                href="/favorites"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8DFD1] bg-white text-xl text-[#123524] transition hover:border-[#0E4F2A] hover:text-[#0E4F2A]"
                aria-label="Favorites"
              >
                ♥
              </a>
              <a href="/profile" className="font-semibold text-[#123524]">
                Profile
              </a>

              <button type="button" onClick={handleLogout} className="font-semibold text-[#123524]">
                Logout
              </button>

              <a
                href="/post-ad"
                className="rounded-xl bg-[#0E4F2A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#07391D]"
              >
                Post an Ad
              </a>
            </>
          ) : (
            <>
              <a href="/login" className="font-semibold text-[#123524]">
                Login
              </a>

              <a
                href="/login"
                className="rounded-xl bg-[#0E4F2A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#07391D]"
              >
                Post an Ad
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
