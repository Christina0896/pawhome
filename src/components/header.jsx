import React from 'react';

const Header = () => {
  return (
    <header className="bg-[var(--header)] border-b border-[var(--header-border)] ">
      <nav className="mx-auto max-w-[1600px] flex justify-between items-center px-6 ">
        <div className="">
          <img src="./img/logo.png" alt="PawHome Logo" className="h-18 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-20 font-semibold">
          <a href="#home">Dogs</a>
          <a href="#about">Cats</a>
          <a href="#contact">Others Pets</a>
          <a href="#contact">Breeders</a>
          <a href="#contact">Shelters</a>
        </div>
        <div className="flex items-center gap-10">
          <a href="#contact" className="font-semibold">
            Login
          </a>
          <button className="listings rounded-xl bg-[var(--color-green)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-green-dark)] ">
            Post an Ad
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
