import SearchBar from './searchbar';
const Hero = () => {
  return (
    <section className=" bg-[#FAF6EC]">
      <div className="mx-auto max-w-[1600px] px-6 pb-10">
        <div className="relative overflow-visible rounded-none">
          <div className="grid min-h-[300px] grid-cols-1 items-center gap-10 md:grid-cols-2">
            {/* Left text */}
            <div className="">
              <h1 className="max-w-xl text-5xl font-bold leading-tight text-[#07391D] md:text-6xl">
                Find your next
                <br />
                pet in Ireland
                <img src="/svg/paw.svg" alt="Paw icon" className="inline-block" />
              </h1>

              <p className="mt-6 max-w-lg  leading-8 text-[#123524]">
                Browse verified pet listings from responsible owners, breeders, and rescues across Ireland.
              </p>
            </div>

            {/* Right image */}
            <div className="relative flex justify-center md:justify-end">
              <img src="/img/hero-img.png" alt="Dog and cat" className="max-h-[390px] w-auto object-contain" />
            </div>
          </div>

          {/* Search box */}

          <SearchBar />

          {/* Trust badges */}
          <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DDEDD8] text-[#0E4F2A]">
                ✓
              </div>
              <div>
                <p className="text-sm font-semibold text-[#123524]">Verified Listings</p>
                <p className="text-xs text-[#5F6F64]">All ads reviewed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DDEDD8] text-[#0E4F2A]">
                🔒
              </div>
              <div>
                <p className="text-sm font-semibold text-[#123524]">Safe & Secure</p>
                <p className="text-xs text-[#5F6F64]">For a safe buying</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DDEDD8] text-[#0E4F2A]">
                👥
              </div>
              <div>
                <p className="text-sm font-semibold text-[#123524]">Responsible Community</p>
                <p className="text-xs text-[#5F6F64]">Guidelines for buyers</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DDEDD8] text-[#0E4F2A]">
                🐾
              </div>
              <div>
                <p className="text-sm font-semibold text-[#123524]">Trusted Marketplace</p>
                <p className="text-xs text-[#5F6F64]">Making tails wag</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
