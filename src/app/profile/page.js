import Header from '../../components/header';
import Footer from '../../components/footer';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />
      <main className="mx-auto max-w-[900px] px-6 py-10">
        <p className="text-sm font-semibold text-(--primary-green)">Profile route diagnostic</p>
        <h1 className="mt-2 text-4xl font-extrabold text-(--secondary-green)">Profile</h1>
        <section className="mt-8 rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-(--secondary-green)">The old profile client is temporarily bypassed.</p>
          <p className="mt-3 text-sm text-(--muted-green-text)">If this page loads, the bug is inside ProfilePageClient or one of the profile API calls.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
