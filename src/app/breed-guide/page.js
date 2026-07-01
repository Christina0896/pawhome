import Link from 'next/link';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { dogBreeds } from '../../data/petOptions';

export const metadata = {
  title: 'Dog Breed Guide Ireland | A-Z Dog Breeds | PawHome',
  description:
    'Browse PawHome’s A-Z dog breed guide for Ireland. Learn about dog breeds, puppies, temperament, care needs, suitability and responsible buying or adoption.',
  alternates: {
    canonical: '/breed-guide',
  },
  openGraph: {
    title: 'Dog Breed Guide Ireland | PawHome',
    description: 'Explore an A-Z dog breed guide for Ireland with breed information, care advice and PawHome listing links.',
    url: '/breed-guide',
    siteName: 'PawHome',
    type: 'website',
  },
};

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function groupBreedsByLetter(breeds) {
  return breeds.reduce((groups, breed) => {
    const letter = breed.charAt(0).toUpperCase();

    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(breed);

    return groups;
  }, {});
}

const groupedBreeds = groupBreedsByLetter(dogBreeds);
const letters = Object.keys(groupedBreeds).sort();

const guideSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Dog Breed Guide Ireland',
  description:
    'An A-Z dog breed guide for people in Ireland researching puppies, dogs, temperament, care needs and responsible buying or adoption.',
  url: 'https://pawhome.ie/breed-guide',
  about: {
    '@type': 'Thing',
    name: 'Dog breeds',
  },
};

export default function BreedGuidePage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-(--page-max-width) px-4 py-10 md:px-6 md:py-14">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }}
        />

        <nav className="mb-8 text-sm font-semibold text-(--muted-green-text)" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-(--primary-green)">
            Home
          </Link>
          <span className="mx-2">›</span>
          <span className="text-(--primary-green)">Dog Breed Guide</span>
        </nav>

        <section className="overflow-hidden rounded-3xl border border-(--border-beige) bg-white shadow-sm">
          <div className="grid gap-8 p-6 md:grid-cols-[1.4fr_0.8fr] md:p-10">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-(--primary-orange)">PawHome Breed Guide</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-(--primary-green) md:text-5xl">
                Dog Breeds A-Z
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-(--muted-green-text)">
                Browse dog breeds in Ireland and learn what to check before buying, adopting or rehoming a dog. Start with the A-Z list, then open a breed page for temperament, care needs, size, grooming, health checks and current listings.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/dogs-for-sale"
                  className="rounded-xl bg-(--primary-green) px-5 py-3 text-sm font-extrabold text-white transition hover:bg-(--secondary-green)"
                >
                  View Dogs for Sale
                </Link>
                <Link
                  href="/dogs-for-adoption"
                  className="rounded-xl border border-(--primary-green) bg-white px-5 py-3 text-sm font-extrabold text-(--primary-green) transition hover:bg-(--light-green)"
                >
                  View Dogs for Adoption
                </Link>
              </div>
            </div>

            <aside className="rounded-2xl border border-(--border-beige) bg-(--background) p-5">
              <h2 className="text-lg font-extrabold text-(--primary-green)">Before choosing a breed</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-(--muted-green-text)">
                <li>✓ Check exercise and grooming needs</li>
                <li>✓ Ask about microchip and vet records</li>
                <li>✓ Consider temperament and household fit</li>
                <li>✓ Avoid sellers who refuse questions</li>
                <li>✓ View the dog in person where possible</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-(--primary-orange)">A-Z Index</p>
              <h2 className="mt-2 text-3xl font-extrabold text-(--primary-green)">Find a dog breed</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-(--muted-green-text)">
                For now, PawHome’s breed guide is focused on dogs. Cat breeds and other pet categories can be added later using the same structure.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {letters.map((letter) => (
                <a
                  key={letter}
                  href={`#${letter}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-(--border-beige) bg-(--background) text-sm font-extrabold text-(--primary-green) hover:border-(--primary-green) hover:bg-(--light-green)"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-8">
            {letters.map((letter) => (
              <div key={letter} id={letter} className="scroll-mt-24">
                <h3 className="border-b border-(--border-beige) pb-3 text-2xl font-extrabold text-(--primary-green)">
                  {letter}
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedBreeds[letter].map((breed) => (
                    <Link
                      key={breed}
                      href={`/breed-guide/${slugify(breed)}`}
                      className="rounded-2xl border border-(--border-beige) bg-(--background) px-4 py-4 text-sm font-bold text-(--secondary-green) transition hover:-translate-y-0.5 hover:border-(--primary-green) hover:bg-(--light-green)"
                    >
                      {breed}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-(--primary-green)">Buying safely</h3>
            <p className="mt-3 text-sm leading-6 text-(--muted-green-text)">
              Always ask for microchip details, vet records, age, parent information and the reason the dog is being sold or rehomed.
            </p>
          </div>

          <div className="rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-(--primary-green)">Breed suitability</h3>
            <p className="mt-3 text-sm leading-6 text-(--muted-green-text)">
              Match the dog’s size, energy level, grooming needs and temperament to your home before contacting a seller.
            </p>
          </div>

          <div className="rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-(--primary-green)">Current listings</h3>
            <p className="mt-3 text-sm leading-6 text-(--muted-green-text)">
              Breed pages can link directly to matching PawHome listings for dogs, puppies, adoption and county searches.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
