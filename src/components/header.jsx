import React from 'react';

const Header = () => {
  return (
    <header>
      <nav className="flex justify-between items-center ">
        <div className="">
          <img src="./img/logo.png" alt="PawHome Logo" className="h-45 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-5">
          <a href="#home">Dogs</a>
          <a href="#about">Cats</a>
          <a href="#contact">Others Pets</a>
          <a href="#contact">Breeders</a>
          <a href="#contact">Shelters</a>
        </div>
        <div className="flex items-center gap-10">
          <a href="#contact">Login</a>
          <button className="listings">Post an Ad</button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
