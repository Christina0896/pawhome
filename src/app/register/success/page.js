import Link from 'next/link';
import Header from '../../../components/header';
import Footer from '../../../components/footer';

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto flex min-h-[70vh] max-w-[900px] items-center justify-center px-6 py-12">
        <div className="w-full rounded-3xl border border-(--border-beige) bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF1E6]">
            <span className="text-4xl">✓</span>
          </div>

          <h1 className="mt-6 text-3xl font-bold text-(--secondary-green)">Account created successfully</h1>

          <p className="mx-auto mt-4 max-w-[600px] text-sm leading-7 text-(--muted-green-text)">
            Your PawHome account has been created. Please check your email to confirm your account before posting an ad.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-full border border-(--border-beige) bg-white px-6 py-3 text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)"
            >
              Back to homepage
            </Link>

            <Link
              href="/post-ad"
              className="rounded-full bg-(--primary-orange) px-6 py-3 text-sm font-bold text-white transition hover:bg-(--secondary-orange)"
            >
              Post an ad
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
