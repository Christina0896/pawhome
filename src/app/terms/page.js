import Header from '../../components/header';
import Footer from '../../components/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-[950px] px-6 py-12">
        <div className="rounded-3xl border border-(--border-beige) bg-white/90 px-6 py-8 shadow-[0_8px_24px_rgba(18,53,36,0.05)] sm:px-10">
          <h1 className="text-3xl font-extrabold tracking-tight ">Terms & Conditions</h1>

          <p className="mt-3 text-sm text-(--muted-green-text)">Last updated: 04 June 2026</p>

          <div className="mt-8 space-y-8 text-sm leading-7 ">
            <section>
              <h2 className="text-xl font-bold ">1. About PawHome</h2>
              <p className="mt-3">
                PawHome is an online pet listing platform that allows users to browse, post, and respond to pet listings
                in Ireland.
              </p>
              <p className="mt-3">
                PawHome provides a platform only. PawHome does not own, breed, sell, inspect, transport, or guarantee
                any animal listed on the website unless this is expressly stated by PawHome in writing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">2. Acceptance of these Terms</h2>
              <p className="mt-3">
                By using PawHome, creating an account, posting a listing, or contacting a seller, you agree to these
                Terms & Conditions. If you do not agree with these Terms, you should not use the website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">3. User accounts</h2>
              <p className="mt-3">
                You are responsible for the information you provide when creating an account. You must keep your login
                details secure and must not allow another person to use your account.
              </p>
              <p className="mt-3">
                PawHome may suspend or remove accounts where we believe there is fraud, misuse, misleading information,
                repeated rule breaking, or risk to users or animals.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">4. Listings</h2>
              <p className="mt-3">
                Users who post listings are responsible for making sure that all information in their listing is
                accurate, lawful, and not misleading. This includes the animal type, breed, age, sex, health
                information, price, registration status, location, photos, and description.
              </p>
              <p className="mt-3">
                PawHome may review, edit, reject, hide, or remove any listing at its discretion, especially where a
                listing appears suspicious, misleading, inappropriate, unlawful, or harmful to animal welfare.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">5. Seller responsibilities</h2>
              <p className="mt-3">Sellers and advertisers must not:</p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>post fake, stolen, or misleading photos;</li>
                <li>make false claims about breed, pedigree, or registration;</li>
                <li>hide known health or behavioural issues;</li>
                <li>advertise animals they do not own or have permission to rehome;</li>
                <li>post illegal, banned, or restricted animals;</li>
                <li>use PawHome for scams, spam, or fraudulent activity;</li>
                <li>pressure buyers into unsafe payments or rushed decisions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold">6. Buyer responsibilities</h2>
              <p className="mt-3">
                Buyers are responsible for carrying out their own checks before buying, adopting, or reserving an
                animal. PawHome does not verify every claim made by users.
              </p>
              <p className="mt-3">Before agreeing to take an animal, buyers should:</p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>meet the animal in person where possible;</li>
                <li>ask to see the animal with its mother where relevant;</li>
                <li>check vaccination, microchip, and veterinary records where applicable;</li>
                <li>verify any IKC, KC, pedigree, or registration claims;</li>
                <li>avoid sending deposits or payments if something feels suspicious;</li>
                <li>report suspicious listings to PawHome.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold">7. No guarantee by PawHome</h2>
              <p className="mt-3">
                PawHome does not guarantee the accuracy of listings, the health, behaviour, breed, pedigree,
                registration, availability, price, or suitability of any animal.
              </p>
              <p className="mt-3">
                Any agreement, payment, deposit, collection, delivery, adoption, sale, or dispute is between the buyer
                and the seller. PawHome is not a party to that agreement unless expressly stated in writing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">8. Payments and deposits</h2>
              <p className="mt-3">
                PawHome does not currently process payments between buyers and sellers. Any payment made outside PawHome
                is made at the user’s own risk.
              </p>
              <p className="mt-3">
                Users should be cautious with deposits, bank transfers, payment links, courier requests, or sellers who
                refuse to allow normal checks.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">9. Reporting listings</h2>
              <p className="mt-3">
                Users can report suspicious, misleading, illegal, or harmful listings through the Contact Us / Report an
                issue feature. PawHome may review reports and take action where appropriate.
              </p>
              <p className="mt-3">
                Reporting a listing does not guarantee that PawHome will remove it, but we may investigate, request
                further information, suspend accounts, or remove content where needed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">10. Prohibited use</h2>
              <p className="mt-3">You must not use PawHome to:</p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>break Irish law or any applicable regulation;</li>
                <li>post fraudulent or misleading content;</li>
                <li>harass, threaten, abuse, or discriminate against other users;</li>
                <li>upload viruses, malicious code, or harmful content;</li>
                <li>scrape, copy, or misuse website data;</li>
                <li>interfere with the security or operation of the website.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold">11. Animal welfare</h2>
              <p className="mt-3">
                PawHome supports responsible pet ownership and animal welfare. Listings that appear to encourage
                irresponsible breeding, unsafe rehoming, cruelty, neglect, or unlawful activity may be removed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">12. Limitation of liability</h2>
              <p className="mt-3">
                To the fullest extent permitted by law, PawHome is not liable for loss, damage, disputes, payments,
                health issues, behavioural issues, false information, or user actions arising from listings or contact
                between users.
              </p>
              <p className="mt-3">
                Nothing in these Terms excludes or limits liability where it would be unlawful to do so.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">13. Changes to the website</h2>
              <p className="mt-3">
                PawHome may change, suspend, or remove features of the website at any time. We may also update these
                Terms from time to time. The latest version will be available on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">14. Privacy</h2>
              <p className="mt-3">
                PawHome processes personal data in accordance with its Privacy Policy. Users should read the Privacy
                Policy to understand how their personal data is collected, used, stored, and protected.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">15. Governing law</h2>
              <p className="mt-3">
                These Terms are governed by the laws of Ireland. Any disputes relating to these Terms or use of PawHome
                will be subject to the courts of Ireland, unless mandatory consumer law provides otherwise.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">16. Contact</h2>
              <p className="mt-3">
                If you have questions about these Terms, or if you want to report an issue, please use the Contact Us
                form on PawHome.
              </p>
            </section>

            <div className="rounded-2xl bg-(--background) p-4 text-xs leading-6 text-(--muted-green-text)">
              <p>
                Note: This page is a practical draft for an Irish pet listing platform and should be reviewed before
                public launch. Irish businesses must provide clear and fair information to consumers, and online
                platforms may have transparency duties depending on how they operate. Privacy information must also be
                provided where personal data is collected.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
