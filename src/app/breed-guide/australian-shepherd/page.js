import Link from 'next/link';
import Header from '../../../components/header';
import Footer from '../../../components/footer';
import {
  AgeIcon,
  BreedIcon,
  CalendarIcon,
  GroupIcon,
  HealthIcon,
  LitterIcon,
  LocationIcon,
  PawIcon,
  ShieldCheckIcon,
  VetIcon,
} from '../../../components/Icons';

export const metadata = {
  title: 'Australian Shepherd Guide Ireland | Temperament, Care & Listings | PawHome',
  description:
    'Learn about Australian Shepherds in Ireland, including temperament, exercise needs, grooming, health considerations, suitability and what to check before buying or adopting.',
  alternates: {
    canonical: '/breed-guide/australian-shepherd',
  },
  openGraph: {
    title: 'Australian Shepherd Guide Ireland | PawHome',
    description:
      'A practical Australian Shepherd breed guide for Ireland covering temperament, care, exercise, grooming, health checks and PawHome listings.',
    url: '/breed-guide/australian-shepherd',
    siteName: 'PawHome',
    type: 'article',
  },
};

const quickFacts = [
  ['Size', 'Medium', BreedIcon],
  ['Lifespan', '12 - 15 years', CalendarIcon],
  ['Family Friendly', 'Yes', GroupIcon],
  ['Good with Pets', 'Usually', PawIcon],
  ['Exercise Needs', 'Very High', AgeIcon],
  ['Grooming Needs', 'Medium', HealthIcon],
  ['Experience', 'Intermediate', VetIcon],
];

const sections = [
  {
    title: 'Temperament',
    iconName: 'temperament',
    items: ['Intelligent and eager to learn', 'Energetic and work-driven', 'Loyal with their family', 'Can be sensitive and alert'],
    text: 'Australian Shepherds are usually clever, active dogs that bond closely with their owners. They often need structure, training and daily mental stimulation.',
  },
  {
    title: 'Size & Appearance',
    iconName: 'size',
    items: ['Male: about 51 - 58 cm', 'Female: about 46 - 53 cm', 'Athletic medium-sized build', 'Coat colours can include black, red, blue merle and red merle'],
    text: 'They have a double coat, expressive eyes and an athletic body. Some Australian Shepherds may have striking merle patterns or different coloured eyes.',
  },
  {
    title: 'Exercise & Enrichment',
    iconName: 'exercise',
    items: ['Needs 1.5 - 2+ hours of activity daily', 'Enjoys training and games', 'Benefits from puzzle feeders and scent work', 'Can become restless without enough stimulation'],
    text: 'This breed is best suited to active owners who can provide exercise, training, social time and jobs to do.',
  },
  {
    title: 'Grooming & Care',
    iconName: 'grooming',
    items: ['Brush several times per week', 'More brushing during shedding periods', 'Check ears and paws regularly', 'Nail trimming and dental care are important'],
    text: 'Australian Shepherds have a medium-length double coat that sheds. Regular brushing helps reduce matting and keeps the coat healthy.',
  },
  {
    title: 'Health Considerations',
    iconName: 'health',
    items: ['Hip and elbow issues', 'Eye conditions', 'MDR1 drug sensitivity can occur', 'Epilepsy can occur in the breed', 'Weight and joint care are important'],
    text: 'Ask about health testing, vet checks, vaccination, microchip details and any known hereditary issues before buying or adopting.',
  },
  {
    title: 'Suitability',
    iconName: 'suitability',
    items: ['May suit active families', 'Good for owners who enjoy training', 'Best with time, space and routine', 'May not suit homes where the dog is left alone all day'],
    text: 'Australian Shepherds are not usually low-maintenance dogs. They need a household that can provide consistent exercise, attention and training.',
  },
];

const faqs = [
  ['Is an Australian Shepherd good for families?', 'Australian Shepherds can be good family dogs when properly trained, socialised and exercised. They are usually better suited to active families with time for daily training and enrichment.'],
  ['How much exercise does an Australian Shepherd need?', 'Most Australian Shepherds need high daily exercise and mental stimulation. A short walk alone is usually not enough for this breed.'],
  ['Is an Australian Shepherd suitable for first-time owners?', 'They can be challenging for first-time owners because of their intelligence, energy and need for structure. A committed first-time owner may manage well with training support.'],
  ['What should I ask before buying an Australian Shepherd?', 'Ask about microchip details, vet checks, vaccination, worming, parent health, temperament, socialisation, age and why the dog or puppy is being sold.'],
  ['Where can I find Australian Shepherds in Ireland?', 'You can check PawHome listings for Australian Shepherd puppies, adult dogs and adoption listings across Ireland.'],
];

const breedSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Australian Shepherd Guide Ireland',
  description:
    'A PawHome breed guide for Australian Shepherds in Ireland covering temperament, exercise, grooming, health, suitability and safe buying or adoption.',
  mainEntityOfPage: 'https://pawhome.ie/breed-guide/australian-shepherd',
  publisher: {
    '@type': 'Organization',
    name: 'PawHome',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(([question, answer]) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  })),
};

function SectionIcon({ name }) {
  const className = 'h-6 w-6 text-(--primary-green)';

  if (name === 'temperament') return <GroupIcon className={className} />;
  if (name === 'size') return <BreedIcon className={className} />;
  if (name === 'exercise') return <AgeIcon className={className} />;
  if (name === 'grooming') return <HealthIcon className={className} />;
  if (name === 'health') return <VetIcon className={className} />;
  if (name === 'suitability') return <LocationIcon className={className} />;

  return <PawIcon className={className} />;
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

export default function AustralianShepherdGuidePage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-(--page-max-width) px-4 py-8 md:px-6 md:py-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breedSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

        <nav className="mb-7 text-sm font-semibold text-(--muted-green-text)" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-(--primary-green)">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/breed-guide" className="hover:text-(--primary-green)">Dog Breeds</Link>
          <span className="mx-2">›</span>
          <span className="text-(--primary-green)">Australian Shepherd Guide</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <section className="overflow-hidden rounded-2xl border border-(--border-beige) bg-white shadow-sm">
              <div className="grid md:grid-cols-[1fr_360px]">
                <div className="p-6 md:p-8">
                  <h1 className="text-4xl font-extrabold tracking-tight text-(--primary-green)">Australian Shepherd Guide</h1>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-(--secondary-green)">
                    Australian Shepherds are intelligent, energetic dogs known for their loyalty, trainability and striking coats. This guide covers temperament, exercise needs, grooming, health, suitability and what to check before choosing an Australian Shepherd in Ireland.
                  </p>
                </div>

                <div className="relative flex min-h-[260px] items-center justify-center bg-gradient-to-br from-[#DDEDD8] via-[#FAF6EC] to-white text-(--primary-green)">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,79,42,0.16),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.14),transparent_30%)]" />
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/80 shadow-sm">
                    <PawIcon className="h-16 w-16" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-0 border-t border-(--border-beige) bg-white sm:grid-cols-3 lg:grid-cols-7">
                {quickFacts.map(([label, value, Icon]) => (
                  <div key={label} className="border-b border-r border-(--border-beige) px-4 py-4 text-center last:border-r-0 lg:border-b-0">
                    <Icon className="mx-auto h-5 w-5 text-(--primary-green)" />
                    <p className="mt-2 text-xs font-bold text-(--muted-green-text)">{label}</p>
                    <p className="mt-1 text-xs font-extrabold text-(--primary-green)">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm md:p-7">
              <h2 className="text-2xl font-extrabold text-(--primary-green)">About the Australian Shepherd</h2>
              <p className="mt-4 text-sm leading-7 text-(--secondary-green)">
                Australian Shepherds are active working-style dogs that often thrive when they have training, exercise and close involvement with their household. They are popular with people who enjoy outdoor activity, dog training and a highly responsive companion. They may not be suitable for quiet homes that want a very low-energy dog.
              </p>
            </section>

            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sections.map((section) => (
                <article key={section.title} className="rounded-2xl border border-(--border-beige) bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-extrabold text-(--primary-green)">{section.title}</h2>
                    <SectionIcon name={section.iconName} />
                  </div>
                  <CheckList items={section.items} />
                  <p className="mt-4 text-sm leading-7 text-(--secondary-green)">{section.text}</p>
                </article>
              ))}
            </section>

            <section className="mt-6 rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm md:p-7">
              <h2 className="text-2xl font-extrabold text-(--primary-green)">Costs in Ireland (Estimated)</h2>
              <div className="mt-6 grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ['Purchase/Adoption', '€800 - €2,500+', PawIcon],
                  ['Food', '€45 - €90 / month', LitterIcon],
                  ['Vet Care', '€300 - €700 / year', VetIcon],
                  ['Insurance', '€20 - €50 / month', ShieldCheckIcon],
                  ['Equipment', '€150 - €350', CalendarIcon],
                ].map(([label, value, Icon]) => (
                  <div key={label} className="rounded-xl border border-(--border-beige) bg-(--background) px-3 py-4">
                    <Icon className="mx-auto h-4 w-4 text-(--primary-green)" />
                    <p className="mt-2 text-xs font-bold text-(--muted-green-text)">{label}</p>
                    <p className="mt-1 text-sm font-extrabold text-(--primary-green)">{value}</p>
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
                    <CheckList
                      items={[
                        'View the dog in person where possible',
                        'Ask for vet records and vaccination history',
                        'Check microchip details',
                        'Ask why the dog is being sold or rehomed',
                        'Avoid paying large deposits without verification',
                        'Be careful with unrealistic prices',
                        'Never send money to someone you do not know',
                        'Report suspicious listings',
                      ]}
                    />
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
                <p className="mt-2 text-sm text-(--muted-green-text)">Quick answers to common questions about Australian Shepherds in Ireland.</p>
                <div className="mt-5 divide-y divide-(--border-beige)">
                  {faqs.map(([question, answer]) => (
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
                  Browse Australian Shepherd listings across Ireland today.
                </p>
                <Link href="/australian-shepherd-puppies" className="mt-4 inline-flex rounded-xl bg-(--primary-green) px-5 py-3 text-sm font-extrabold text-white hover:bg-(--secondary-green)">
                  View Listings
                </Link>
              </aside>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-(--primary-green)">In This Guide</h2>
              <div className="mt-4 space-y-3 text-sm font-semibold text-(--secondary-green)">
                {['About the Australian Shepherd', 'Temperament', 'Size & Appearance', 'Exercise & Enrichment', 'Grooming & Care', 'Health Considerations', 'Suitability', 'Costs in Ireland', 'Buying or Adopting Safely', 'FAQ'].map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-(--border-beige) bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-(--primary-green)">Looking for an Australian Shepherd?</h2>
              <p className="mt-4 text-sm leading-6 text-(--secondary-green)">
                Browse current listings from breeders, owners and rescues across Ireland.
              </p>
              <div className="mt-5 space-y-3">
                <Link href="/australian-shepherd-puppies" className="block rounded-xl bg-(--primary-green) px-4 py-3 text-center text-sm font-extrabold text-white hover:bg-(--secondary-green)">
                  View Australian Shepherd Listings
                </Link>
                <Link href="/australian-shepherd-dogs" className="block rounded-xl border border-(--primary-green) bg-white px-4 py-3 text-center text-sm font-extrabold text-(--primary-green) hover:bg-(--light-green)">
                  Australian Shepherds for Adoption
                </Link>
                <Link href="/dogs-for-sale" className="block rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-center text-sm font-extrabold text-(--primary-green) hover:bg-(--light-green)">
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
