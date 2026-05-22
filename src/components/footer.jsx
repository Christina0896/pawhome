import React from 'react';
const Footer = () => {
  return (
    <footer className="mx-auto max-w-[1600px]  ">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Browse by County */}
        <div className="rounded-xl border border-[#EFE5D6] bg-[#FFFCF5] p-5">
          <h2 className=" font-semibold text-[#123524]">Browse by County</h2>

          <div className="mt-3 flex items-start justify-between gap-4">
            <ul className="text-sm text-[#123524]">
              <li>County</li>
              <li>County</li>
              <li>County</li>
              <li>County</li>
              <li>County</li>
            </ul>

            <img src="/svg/ireland.svg" alt="Ireland map" className="h-28 w-28 object-contain opacity-80" />
          </div>

          <a href="/counties" className="mt-4 block text-sm font-semibold text-[#0E4F2A]">
            View all counties
          </a>
        </div>

        {/* Browse by Breed */}
        <div className="rounded-xl border border-[#EFE5D6] bg-[#FFFCF5] p-5">
          <h2 className=" font-semibold text-[#123524]">Browse by Breed</h2>

          <div className="mt-3 flex items-start justify-between gap-4">
            <ul className="text-sm text-[#123524]">
              <li>Breed </li>
              <li>Breed </li>
              <li>Breed</li>
              <li>Breed</li>
              <li>Breed</li>
            </ul>

            <img src="/svg/paw.svg" alt="Paw icon" className="h-24 w-24 object-contain opacity-60" />
          </div>

          <a href="/breeds" className="mt-4 block text-sm font-semibold text-[#0E4F2A]">
            View all breeds
          </a>
        </div>

        {/* Responsible Pet Buying */}
        <div className="rounded-xl border border-[#EFE5D6] bg-[#FFFCF5] p-5">
          <h2 className=" font-semibold text-[#123524]">Responsible Pet Buying</h2>

          <p className="mt-3 text-sm leading-6 text-[#123524]">
            Follow our guide to help ensure you and your new pet have the best start together.
          </p>

          <button className="mt-5 rounded-xl border border-[#0E4F2A] px-5 py-2.5 text-sm font-semibold text-[#0E4F2A]">
            Read the Guide
          </button>
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

          <a href="/safety" className="mt-6 block text-sm font-semibold">
            Learn more safety tips →
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
