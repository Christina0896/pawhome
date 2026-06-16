export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6EC]">
          <Header />

          <main className="mx-auto max-w-[1500px] px-6 py-10">
            <p className="text-sm font-semibold text-[#5F6F64]">Loading listings...</p>
          </main>

          <Footer />
        </div>
      }
    >
      <ListingsPageContent />
    </Suspense>
  );
}
