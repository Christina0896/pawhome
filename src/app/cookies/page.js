import Header from '../../components/header';
import Footer from '../../components/footer';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-[900px] px-6 py-12">
        <div className="rounded-3xl border border-(--border-beige) bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-(--secondary-green)">Cookie Policy</h1>

          <p className="mt-4 text-sm leading-7 text-(--muted-green-text)">
            PawHome uses essential cookies and local browser storage to make the website work correctly. This includes
            keeping users logged in, protecting account access, and supporting core marketplace features such as posting
            ads and saving favourite listings.
          </p>

          <h2 className="mt-8 text-xl font-bold text-(--secondary-green)">Essential storage</h2>

          <p className="mt-3 text-sm leading-7 text-(--muted-green-text)">
            Essential storage is required for the website to function. This may include authentication session data,
            security-related session data, and user interface preferences.
          </p>

          <h2 className="mt-8 text-xl font-bold text-(--secondary-green)">Analytics and marketing</h2>

          <p className="mt-3 text-sm leading-7 text-(--muted-green-text)">
            PawHome does not currently use advertising cookies, marketing cookies, or third-party tracking pixels. If
            this changes, PawHome will ask for consent before loading non-essential cookies or tracking technologies.
          </p>

          <h2 className="mt-8 text-xl font-bold text-(--secondary-green)">Managing cookies</h2>

          <p className="mt-3 text-sm leading-7 text-(--muted-green-text)">
            You can control or delete cookies through your browser settings. Blocking essential cookies or browser
            storage may stop login, account, or marketplace features from working correctly.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
