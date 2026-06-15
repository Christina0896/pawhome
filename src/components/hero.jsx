import SearchBar from './searchbar';
import { UnderlineIcon, ShieldCheckIcon, LockIcon, UsersIcon, HeadsetIcon } from './Icons';

export default function Hero() {
  return (
    <section className="relative bg-(--background)">
      {/* Banner area only */}
      <div className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img src="/img/banner.png" alt="Pets on sofa" className="h-full w-full  object-cover object-[2%_40%] " />

          {/* Desktop overlay so text stays readable */}
          <div className="absolute inset-0 bg-linear-to-r from-(--background)/65 via-(--background)/5 to-transparent" />

          {/* Stronger mobile overlay */}
          <div className="absolute inset-0 bg-(--background)/85 md:hidden" />
        </div>

        {/* Hero text */}
        <div className="relative z-10 mx-auto max-w-(--page-max-width) px-4 pt-10 pb-24 sm:px-6 sm:pt-12 sm:pb-28 lg:pt-16 lg:pb-32">
          <div className="max-w-140">
            <h1 className="text-[42px]  font-bold leading-[0.95] text-(--primary-green) sm:text-[52px] lg:text-[64px]">
              <span className="block">Find your next</span>

              <span className="block">
                pet in{' '}
                <span className="relative inline-block">
                  Ireland
                  <svg
                    className="absolute -bottom-3 left-0 h-4 w-full text-(--primary-orange)"
                    viewBox="0 0 200 20"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M4 14C52 5 139 5 196 13" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            </h1>

            <p className="mt-5 max-w-[520px]   text-(--muted-green-text) sm:text-lg sm:leading-8">
              Browse verified pet listings from responsible owners, breeders, and rescues across Ireland.
            </p>
          </div>
        </div>
      </div>

      {/* Search bar overlaps only the bottom of the banner */}
      <div className="relative z-20 mx-auto -mt-12 max-w-350 px-4 sm:px-6 lg:-mt-16">
        <SearchBar />
      </div>

      {/* Trust cards - hidden on small screens */}
      <div className="relative z-10 mx-auto mt-3 hidden max-w-6xl  md:block">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {/* Verified Listings */}
          <div className="flex h-20.5 items-center gap-4 rounded-xl border border-(--border-beige) px-5 py-3 shadow-[0_8px_24px_rgba(18,53,36,0.06)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--light-green)">
              <ShieldCheckIcon className="h-7 w-7 text-(--primary-green)" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-(--primary-green)">Verified Listings</h3>
              <p className="mt-1 text-xs text-(--muted-green-text)">
                All ads are reviewed for quality and authenticity.
              </p>
            </div>
          </div>

          {/* Safe & Secure */}
          <div className="flex h-20.5 items-center gap-4 rounded-xl border border-(--border-beige)  px-5 py-3 shadow-[0_2px_6px_rgba(18,53,36,0.1)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--light-orange)">
              <LockIcon className="h-7 w-7 text-(--primary-orange)" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-(--primary-green)">Safe & Secure</h3>
              <p className="mt-1 text-xs leading-5 text-(--muted-green-text)">Your safety is our priority.</p>
            </div>
          </div>

          {/* Responsible Community */}
          <div className="flex h-20.5 items-center gap-4 rounded-xl border border-(--border-beige)  px-5 py-3 shadow-[0_8px_24px_rgba(18,53,36,0.06)] ">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--light-green)">
              <UsersIcon className="h-7 w-7 text-(--primary-green)" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-(--primary-green)">Responsible Community</h3>
              <p className="mt-1 text-xs leading-5 text-(--muted-green-text)">Promoting responsible pet ownership.</p>
            </div>
          </div>

          {/* Helpful Support */}
          <div className="flex h-[82px] items-center gap-4 rounded-xl border border-(--border-beige)  px-5 py-3 shadow-[0_2px_6px_rgba(18,53,36,0.1)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--light-orange)">
              <HeadsetIcon className="h-7 w-7 text-(--primary-orange)" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-(--primary-green)">Helpful Support</h3>
              <p className="mt-1 text-xs leading-5 text-(--muted-green-text)">
                Our team is here to help every step of the way.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
