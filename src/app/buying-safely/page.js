import Link from 'next/link';
import Header from '../../components/header';
import Footer from '../../components/footer';

const safetyChecks = [
  'Meet the pet and seller in person before paying any money.',
  'Do not pay a deposit before viewing the pet and paperwork.',
  'Ask to see microchip information, vaccination records, and vet details where relevant.',
  'Dogs and cats should not leave their mother too early. Be cautious if a seller wants a very young animal collected immediately.',
  'Meet at the seller’s home or rescue premises, not in a car park or random public place.',
  'Walk away if the seller pressures you, avoids questions, or refuses basic checks.',
];

const warningSigns = [
  'The price is unusually low for the breed or age.',
  'The seller asks for payment before a viewing.',
  'Photos look copied, inconsistent, or too polished.',
  'The seller will only communicate off-platform and avoids direct questions.',
  'The animal appears sick, frightened, underweight, or kept in poor conditions.',
];

export default function BuyingSafelyPage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-[1050px] px-6 py-12">
        <div className="rounded-3xl border border-(--border-beige) bg-white px-6 py-8 shadow-[0_8px_24px_rgba(18,53,36,0.05)] sm:px-10">
          <p className="text-sm font-bold uppercase tracking-wide text-(--primary-green)">PawHome Safety</p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-(--secondary-green)">
            Buying or adopting pets safely in Ireland
          </h1>

          <p className="mt-4 max-w-[760px] text-sm leading-7 text-(--muted-green-text)">
            PawHome reviews listings, but buyers should still carry out basic checks before reserving, buying, or adopting a pet.
            Use this page as a practical checklist before contacting or meeting a seller.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-(--border-beige) bg-(--background) p-6">
              <h2 className="text-2xl font-extrabold text-(--secondary-green)">Before you pay</h2>

              <ul className="mt-5 space-y-4 text-sm leading-6 text-(--secondary-green)">
                {safetyChecks.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="font-extrabold text-(--primary-green)">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-red-100 bg-red-50 p-6">
              <h2 className="text-2xl font-extrabold text-red-700">Warning signs</h2>

              <ul className="mt-5 space-y-4 text-sm leading-6 text-red-800">
                {warningSigns.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="font-extrabold">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-8 rounded-2xl border border-(--border-beige) bg-white p-6">
            <h2 className="text-2xl font-extrabold text-(--secondary-green)">Report suspicious listings</h2>

            <p className="mt-3 text-sm leading-7 text-(--muted-green-text)">
              Each listing page includes a report button. Report ads that appear fake, misleading, unsafe, or concerning for animal welfare.
              PawHome can review and remove listings where needed.
            </p>

            <Link
              href="/listings"
              className="mt-6 inline-flex rounded-full bg-(--primary-orange) px-6 py-3 text-sm font-bold text-white transition hover:bg-(--secondary-orange)"
            >
              Browse listings
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
