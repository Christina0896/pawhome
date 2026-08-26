import Image from 'next/image';
import Link from 'next/link';
import Header from './header';
import Footer from './footer';
import {
  AgeIcon,
  BreedIcon,
  CalendarIcon,
  EquipmentIcon,
  ExerciseIcon,
  FoodIcon,
  GalleryIcon,
  GroomingIcon,
  GroupIcon,
  HealthIcon,
  InsuranceIcon,
  IntelligenceIcon,
  LocationIcon,
  PawIcon,
  ShieldCheckIcon,
  SizeIcon,
  TemperamentIcon,
  VetIcon,
} from './Icons';

const iconMap = {
  size: SizeIcon,
  lifespan: CalendarIcon,
  family: GroupIcon,
  pets: PawIcon,
  exercise: ExerciseIcon,
  grooming: GroomingIcon,
  intelligence: IntelligenceIcon,
  temperament: TemperamentIcon,
  health: HealthIcon,
  suitability: LocationIcon,
  purchase: PawIcon,
  food: FoodIcon,
  vet: VetIcon,
  insurance: InsuranceIcon,
  equipment: EquipmentIcon,
  breed: BreedIcon,
  age: AgeIcon,
};

function BreedGuideIcon({ name, className = 'h-5 w-5 text-(--primary-green)' }) {
  const Icon = iconMap[name] || PawIcon;
  return <Icon className={className} />;
}

function CheckList({ items }) {
  return (
    <ul className="mt-4 space-y-2 text-sm leading-6 text-(--secondary-green)">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <ShieldCheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-(--primary-green)" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DogColourCard({ item, breedName, large = false }) {
  const imageAlt = item.alt || `${breedName} ${item.label}`;

  return (
    <div className={`overflow-hidden rounded-xl border border-(--border-beige) bg-white shadow-sm ${large ? 'row-span-2' : ''}`}>
      <div className={`relative flex ${large ? 'h-[250px]' : 'h-[104px]'} items-center justify-center bg-gradient-to-br ${item.tone || 'from-(--light-green) to-white'}`}>
        {item.image ? (
          <Image src={item.image} alt={imageAlt} fill sizes={large ? '420px' : '220px'} className="object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.8),transparent_28%),radial-gradient(circle_at_75%_80%,rgba(14,79,42,0.15),transparent_35%)]" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/75 text-(--primary-green) shadow-sm">
              <PawIcon className="h-9 w-9" />
            </div>
          </>
        )}
      </div>
      <p className="px-3 py-2 text-center text-xs font-extrabold text-(--primary-green)">{item.label}</p>
    </div>
  );
}

export default function BreedGuideTemplate({ guide }) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${guide.name} Guide Ireland`,
    description: guide.metaDescription,
    mainEntityOfPage: `https://pawhome.ie/breed-guide/${guide.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'PawHome',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-(--page-max-width) px-4 py-8 md:px-6 md:py-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

        <nav className="mb-7 text-sm font-semibold text-(--muted-green-text)" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-(--primary-green)">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/breed-guide" className="hover:text-(--primary-green)">Dog Breeds</Link>
          <span className="mx-2">›</span>
          <span className="text-(--primary-green)">{guide.name} Guide</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <section className="overflow-hidden rounded-2xl border border-(--border-beige) bg-white shadow-sm">
              <div className="grid md:grid-cols-[1fr_420px]">
                <div className="p-6 md:p-8">
                  <h1 className="text-4xl font-extrabold tracking-tight text-(--primary-green)">{guide.name} Guide</h1>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-(--secondary-green)">{guide.intro}</p>
                </div>

                <div className="relative flex min-h-[280px] items-center justify-center bg-gradient-to-br from-slate-300 via-stone-100 to-orange-100 text-(--primary-green)">
                  {guide.heroImage ? (
                    <Image src={guide.heroImage} alt={`${guide.name} dog`} fill priority sizes="420px" className="object-cover" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.75),transparent_28%),radial-gradient(circle_at_78%_82%,rgba(14,79,42,0.2),transparent_36%)]" />
                      <div className="relative max-w-[260px] rounded-2xl bg-white/75 p-5 text-center shadow-sm backdrop-blur">
                        <PawIcon className="mx-auto h-16 w-16" />
                        <p className="mt-3 text-sm font-bold leading-6 text-(--primary-green)">{guide.heroNote}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-0 border-t border-(--border-beige) bg-white sm:grid-cols-3 lg:grid-cols-7">
                {guide.quickFacts.map((fact) => (
                  <div key={fact.label} className="border-b border-r border-(--border-beige) px-4 py-4 text-center last:border-r-0 lg:border-b-0">
                    <BreedGuideIcon name={fact.icon} className="mx-auto h-5 w-5 text-(--primary-green)" />
                    <p className="mt-2 text-xs font-bold text-(--muted-green-text)">{fact.label}</p>
                    <p className="mt-1 text-xs font-extrabold text-(--primary-green)">{fact.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-(--border-beige) bg-white p-5 shadow-sm md:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-extrabold text-(--primary-green)">{guide.name} Gallery</h2>
                <GalleryIcon className="h-6 w-6 text-(--primary-green)" />
              </div>
              <div className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
                <DogColourCard item={guide.gallery[0]} breedName={guide.name} large />
                <div className="grid grid-cols-2 gap-4">
                  {guide.gallery.slice(1).map((item) => (
                    <DogColourCard key={item.label} item={item} breedName={guide.name} />
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm md:p-7">
              <h2 className="text-2xl font-extrabold text-(--primary-green)">About the {guide.name}</h2>
              <p className="mt-4 text-sm leading-7 text-(--secondary-green)">{guide.about}</p>
            </section>

            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {guide.sections.map((section) => (
                <article key={section.title} className="rounded-2xl border border-(--border-beige) bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-extrabold text-(--primary-green)">{section.title}</h2>
                    <BreedGuideIcon name={section.icon} className="h-6 w-6 text-(--primary-green)" />
                  </div>
                  <CheckList items={section.items} />
                  <p className="mt-4 text-sm leading-7 text-(--secondary-green)">{section.text}</p>
                </article>
              ))}
            </section>

            <section className="mt-6 rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm md:p-7">
              <h2 className="text-2xl font-extrabold text-(--primary-green)">Costs in Ireland (Estimated)</h2>
              <div className="mt-6 grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-5">
                {guide.costs.map((cost) => (
                  <div key={cost.label} className="rounded-xl border border-(--border-beige) bg-(--background) px-3 py-4">
                    <BreedGuideIcon name={cost.icon} className="mx-auto h-5 w-5 text-(--primary-green)" />
                    <p className="mt-2 text-xs font-bold text-(--muted-green-text)">{cost.label}</p>
                    <p className="mt-1 text-sm font-extrabold text-(--primary-green)">{cost.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs font-medium text-(--muted-green-text)">
                Costs vary based on age, health, breeder or rescue, location, training needs and lifestyle.
              </p>
            </section>

            <section className="mt-6 rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm md:p-7">
              <div className="grid gap-6 md:grid-cols-[1fr_150px] md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-(--primary-green)">Buying or Adopting Safely</h2>
                  <div className="mt-4 grid gap-x-8 md:grid-cols-2">
                    <CheckList items={guide.safety} />
                  </div>
                </div>
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-(--border-beige) bg-(--light-green) text-(--primary-green)">
                  <ShieldCheckIcon className="h-14 w-14" />
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm md:p-7">
                <h2 className="text-2xl font-extrabold text-(--primary-green)">Frequently Asked Questions</h2>
                <p className="mt-2 text-sm text-(--muted-green-text)">Quick answers to common questions about {guide.name}s in Ireland.</p>
                <div className="mt-5 divide-y divide-(--border-beige)">
                  {guide.faqs.map(([question, answer]) => (
                    <details key={question} className="group py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-extrabold text-(--primary-green)">
                        {question}
                        <PawIcon className="h-3.5 w-3.5 shrink-0 text-(--primary-green)" />
                      </summary>
                      <p className="mt-3 text-sm leading-7 text-(--secondary-green)">{answer}</p>
                    </details>
                  ))}
                </div>
              </div>

              <aside className="rounded-2xl border border-(--border-beige) bg-white p-5 shadow-sm">
                <div className="flex h-36 items-center justify-center rounded-xl bg-(--light-green) text-(--primary-green)">
                  <PawIcon className="h-16 w-16" />
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-(--primary-green)">Ready to find your perfect match?</h3>
                <p className="mt-2 text-sm leading-6 text-(--muted-green-text)">
                  Browse {guide.name} listings across Ireland today.
                </p>
                <Link href={guide.listingLinks.primary} className="mt-4 inline-flex rounded-xl bg-(--primary-green) px-5 py-3 text-sm font-extrabold text-white hover:bg-(--secondary-green)">
                  View Listings
                </Link>
              </aside>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-(--primary-green)">In This Guide</h2>
              <div className="mt-4 space-y-3 text-sm font-semibold text-(--secondary-green)">
                {[`About the ${guide.name}`, 'Temperament', 'Size & Appearance', 'Exercise & Enrichment', 'Grooming & Care', 'Health Considerations', 'Suitability', 'Costs in Ireland', 'Buying or Adopting Safely', 'FAQ'].map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-(--primary-green)">Looking for an {guide.name}?</h2>
              <p className="mt-4 text-sm leading-6 text-(--secondary-green)">
                Browse current listings from breeders, owners and rescues across Ireland.
              </p>
              <div className="mt-5 space-y-3">
                <Link href={guide.listingLinks.primary} className="block rounded-xl bg-(--primary-green) px-4 py-3 text-center text-sm font-extrabold text-white hover:bg-(--secondary-green)">
                  View {guide.name} Listings
                </Link>
                <Link href={guide.listingLinks.secondary} className="block rounded-xl border border-(--primary-green) bg-white px-4 py-3 text-center text-sm font-extrabold text-(--primary-green) hover:bg-(--light-green)">
                  {guide.name}s for Adoption
                </Link>
                <Link href={guide.listingLinks.county} className="block rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-center text-sm font-extrabold text-(--primary-green) hover:bg-(--light-green)">
                  View by County
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="h-8 w-8 shrink-0 text-(--primary-green)" />
                <div>
                  <h2 className="text-lg font-extrabold text-(--primary-green)">Adopt or Buy Safely</h2>
                  <p className="mt-2 text-sm leading-6 text-(--secondary-green)">
                    Stay safe when finding your pet. Never send money to anyone you do not know.
                  </p>
                  <Link href="/buying-safely" className="mt-3 inline-block text-sm font-extrabold text-(--primary-green) underline">
                    Read our Safety Tips →
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
