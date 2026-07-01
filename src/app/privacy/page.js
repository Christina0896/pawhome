import Header from '../../components/header';
import Footer from '../../components/footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-[950px] px-6 py-12">
        <div className="rounded-3xl border border-(--border-beige) bg-white px-6 py-8 shadow-[0_8px_24px_rgba(18,53,36,0.05)] sm:px-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-(--secondary-green)">Privacy Policy</h1>

          <p className="mt-3 text-sm text-(--muted-green-text)">Last updated: 29 June 2026</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-(--secondary-green)">
            <section>
              <h2 className="text-xl font-bold">1. Information we collect</h2>
              <p className="mt-3">
                PawHome may collect account details, profile details, listing information, contact information, uploaded listing photos,
                reports, favourites, and technical information needed to operate and protect the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">2. How we use information</h2>
              <p className="mt-3">
                We use information to create and manage accounts, publish and review listings, help users contact sellers, prevent abuse,
                respond to support requests, and improve PawHome.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">3. Public listing information</h2>
              <p className="mt-3">
                Listing details such as title, animal type, breed, county, description, seller display name, seller type, and listing photos
                may be visible publicly when a listing is approved.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">4. Contact details</h2>
              <p className="mt-3">
                Seller phone numbers are used to let buyers contact sellers. PawHome may limit repeated access to protect users and reduce abuse.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">5. Data protection requests</h2>
              <p className="mt-3">
                Users can contact PawHome to request access, correction, or deletion of their personal data, subject to legal and operational requirements.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
