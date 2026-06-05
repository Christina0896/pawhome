import Header from "./header";
import Footer from "./footer";

export default function ComingSoon({ title = "Working on it" }) {
  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <main className="mx-auto max-w-[900px] px-6 py-16">
        <div className="rounded-3xl border border-[#E8DFD1] bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#DDEDD8] text-4xl">
            🐾
          </div>

          <h1 className="mt-6 text-3xl font-bold text-[#123524]">
            {title}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#5F6F64]">
            This page is not ready yet. We are still working on this section of
            PawHome.
          </p>

          <a
            href="/"
            className="mt-8 inline-flex rounded-xl bg-[#0E4F2A] px-6 py-3 text-sm font-semibold text-white"
          >
            Back to Home
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}