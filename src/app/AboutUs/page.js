'use client';

import { useState } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import ContactModal from '../../components/ContactModal';
import Link from 'next/link'

const featureCards = [
  {
    title: 'Reviewed listings',
    description: 'We want listings to be clear, honest, and useful before people make contact.',
    iconBg: 'bg-(--light-green)',
    iconColor: 'text-(--primary-green)',
    icon: (
      <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3L5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" />
        <path d="M8.8 12.2 11 14.4l4.5-4.6" />
      </svg>
    ),
  },
  {
    title: 'Safer buying',
    description: 'We encourage buyers to check records, meet safely, and avoid rushed decisions.',
    iconBg: 'bg-(--light-orange)',
    iconColor: 'text-(--primary-orange)',
    icon: (
      <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7.5A4 4 0 0 1 12 3.5a4 4 0 0 1 4 4V10" />
        <path d="M12 15v2" />
      </svg>
    ),
  },
  {
    title: 'Responsible community',
    description: 'PawHome is for people who care about animals, not quick careless sales.',
    iconBg: 'bg-(--light-green)',
    iconColor: 'text-(--primary-green)',
    icon: (
      <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="3" />
        <path d="M6.5 19c.5-3.2 2.6-5 5.5-5s5 1.8 5.5 5" />
        <circle cx="5.5" cy="10" r="2" />
        <path d="M2.5 18c.3-2.2 1.5-3.5 3.3-3.8" />
        <circle cx="18.5" cy="10" r="2" />
        <path d="M21.5 18c-.3-2.2-1.5-3.5-3.3-3.8" />
      </svg>
    ),
  },
  {
    title: 'Easy reporting',
    description: 'Users can report suspicious listings so we can review and act where needed.',
    iconBg: 'bg-(--light-orange)',
    iconColor: 'text-(--primary-orange)',
    icon: (
      <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M4 13v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
        <path d="M20 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  // UI state
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-(--background)">
        <Header />

        <main>
          {/* Hero */}
          <section className="mx-auto grid max-w-(--page-max-width) grid-cols-1 items-center gap-12 px-6 py-14 lg:grid-cols-2 lg:py-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-(--primary-green)">About PawHome</p>

              <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight text-(--secondary-green) sm:text-5xl">
                A more personal way to find pets in Ireland
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-(--muted-green-text)">
                PawHome was created to make pet rehoming in Ireland feel safer, clearer, and more trustworthy. Our goal
                is to connect responsible owners, breeders, shelters, and future pet parents in one simple place.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/listings"
                  className="rounded-xl bg-(--primary-orange) px-6 py-3 text-sm font-bold text-white transition hover:scale-105 hover:bg-(--secondary-orange)"
                >
                  Browse listings
                </Link>

                <Link
                  href="/post-ad"
                  className="rounded-xl bg-(--primary-green) px-6 py-3 text-sm font-bold text-white transition hover:scale-105 hover:bg-(--secondary-green)"
                >
                  Post an ad
                </Link>
              </div>
            </div>

            {/* Image collage */}
            <div className="relative min-h-[360px]">
              <img
                src="/img/about-main.jpg"
                alt="Pets in a home"
                className="absolute left-0 top-8 h-[260px] w-[72%] rounded-2xl object-cover shadow-[0_10px_30px_rgba(18,53,36,0.12)]"
              />

              <img
                src="/img/about-small-1.jpg"
                alt="Pet detail"
                className="absolute right-4 top-0 h-28 w-32 rounded-2xl object-cover shadow-[0_8px_20px_rgba(18,53,36,0.12)]"
              />

              <img
                src="/img/about-small-2.jpg"
                alt="Pet with owner"
                className="absolute right-0 top-36 h-32 w-40 rounded-2xl object-cover shadow-[0_8px_20px_rgba(18,53,36,0.12)]"
              />

              <img
                src="/img/about-small-3.jpg"
                alt="Happy pet"
                className="absolute bottom-0 right-16 h-32 w-32 rounded-2xl object-cover shadow-[0_8px_20px_rgba(18,53,36,0.12)]"
              />
            </div>
          </section>

          {/* What makes us different */}
          <section className="mx-auto max-w-[1300px] px-6 py-12">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-(--secondary-green)">What makes PawHome different?</h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-(--muted-green-text)">
                PawHome is designed around trust, clarity, and responsible pet ownership.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((card) => (
                <FeatureCard key={card.title} card={card} />
              ))}
            </div>
          </section>

          {/* Personal story */}
          <section className="mx-auto grid max-w-[1300px] grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2">
            <div className="relative">
              <img
                src="/img/about-founder.jpg"
                alt="PawHome founder with pet"
                className="h-[360px] w-full rounded-3xl object-cover shadow-[0_10px_30px_rgba(18,53,36,0.12)]"
              />

              <div className="absolute -bottom-5 -left-5 -z-0 h-24 w-24 rounded-full bg-(--light-orange)" />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-(--primary-green)">A personal project</p>

              <h2 className="mt-4 text-3xl font-extrabold text-(--secondary-green)">Built by animal people</h2>

              <p className="mt-5 text-sm leading-8 text-(--muted-green-text)">
                PawHome is built from a simple idea: finding or rehoming a pet should feel safe, transparent, and human.
                We know how much trust is involved when animals are concerned, and we want PawHome to reflect that.
              </p>

              <p className="mt-4 text-sm leading-8 text-(--muted-green-text)">
                The goal is not just to list pets. The goal is to help the right animals find the right homes, while
                giving buyers and sellers a clearer, safer way to connect.
              </p>

              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="mt-6 cursor-pointer rounded-xl bg-(--primary-green) px-6 py-3 text-sm font-bold text-white transition hover:scale-105 hover:bg-(--secondary-green)"
              >
                Contact PawHome
              </button>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} />}
    </>
  );
}

const FeatureCard = ({ card }) => {
  return (
    <div className="rounded-xl border border-(--border-beige) bg-white/85 p-6 shadow-[0_8px_24px_rgba(18,53,36,0.05)]">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.iconBg} ${card.iconColor}`}>
        {card.icon}
      </div>

      <h3 className="mt-5 text-lg font-bold text-(--secondary-green)">{card.title}</h3>

      <p className="mt-3 text-sm leading-7 text-(--muted-green-text)">{card.description}</p>
    </div>
  );
};
