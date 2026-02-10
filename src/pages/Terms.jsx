import SEO from '../components/SEO';

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Read the Shiny Pull Terms of Service to understand the rules and regulations for using our platform."
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-indigo-100">Last updated: February 1, 2026</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="prose max-w-none">
              <Section title="1. Acceptance of Terms">
                <p>
                  By accessing and using ShinyPull, you accept and agree to be bound by these Terms of Service.
                  If you do not agree to these terms, please do not use our service.
                </p>
              </Section>

              <Section title="2. Description of Service">
                <p>
                  ShinyPull provides social media analytics and statistics for content creators across multiple
                  platforms including YouTube, Twitch, and Kick. We collect publicly available
                  data from official platform APIs.
                </p>
              </Section>

              <Section title="3. User Accounts">
                <p className="mb-2">When creating an account, you agree to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>
              </Section>

              <Section title="4. Data Accuracy">
                <p>
                  While we strive to provide accurate statistics, we cannot guarantee 100% accuracy. Data is
                  collected from third-party APIs and may be subject to delays, errors, or inconsistencies.
                  Earnings estimates are approximations based on industry averages and should not be considered
                  exact figures.
                </p>
              </Section>

              <Section title="5. Live Counter Estimates">
                <p className="mb-4">
                  Our "Live Counter" feature displays <strong>estimated</strong> real-time subscriber and follower
                  counts. These numbers are simulations based on:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                  <li>The most recent publicly available count from the platform's official API</li>
                  <li>Typical growth patterns for channels of similar size</li>
                  <li>Statistical modeling to simulate realistic fluctuations</li>
                </ul>
                <p className="mb-4">
                  <strong>Important:</strong> The live counter does NOT display the actual real-time count from
                  YouTube or Twitch. Platform APIs only provide rounded/cached subscriber counts (e.g., "465M"
                  instead of "465,523,243"). The additional digits shown are algorithmic estimates for
                  entertainment purposes.
                </p>
                <p>
                  For the most accurate counts, please refer to the official platform (YouTube Studio, Twitch Dashboard).
                  ShinyPull is not responsible for any decisions made based on these estimated figures.
                </p>
              </Section>

              <Section title="6. Acceptable Use">
                <p className="mb-2">You agree NOT to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Use automated tools to scrape or download data</li>
                  <li>Attempt to access unauthorized areas of the service</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Use the service for any unlawful purpose</li>
                  <li>Impersonate others or misrepresent your affiliation</li>
                </ul>
              </Section>

              <Section title="7. Intellectual Property">
                <p>
                  All content, features, and functionality of ShinyPull are owned by us and protected by
                  international copyright, trademark, and other intellectual property laws. Creator statistics
                  and public data are owned by their respective platforms and creators.
                </p>
              </Section>

              <Section title="8. Third-Party Platforms">
                <p>
                  Our service relies on third-party platform APIs (YouTube, Twitch, etc.). We are not
                  affiliated with these platforms. Changes to their APIs or terms may affect our service.
                </p>
              </Section>

              <Section title="9. Limitation of Liability">
                <p>
                  ShinyPull is provided "as is" without warranties of any kind. We shall not be liable
                  for any indirect, incidental, special, consequential, or punitive damages resulting from
                  your use or inability to use the service.
                </p>
              </Section>

              <Section title="10. Service Modifications">
                <p>
                  We reserve the right to modify, suspend, or discontinue any part of our service at any
                  time without notice. We may also update these Terms of Service periodically.
                </p>
              </Section>

              <Section title="11. Termination">
                <p>
                  We may terminate or suspend your account and access to the service at our sole discretion,
                  without notice, for conduct that violates these Terms or is harmful to other users.
                </p>
              </Section>

              <Section title="12. Amazon Associates Disclosure">
                <p className="mb-4">
                  ShinyPull is a participant in the Amazon Services LLC Associates Program, an affiliate
                  advertising program designed to provide a means for sites to earn advertising fees by
                  advertising and linking to Amazon.com.
                </p>
                <p className="mb-4">
                  <strong>As an Amazon Associate I earn from qualifying purchases.</strong>
                </p>
                <p>
                  When you click on product links in our blog posts and make a purchase, we may earn a
                  commission at no additional cost to you. This helps support our platform and allows us
                  to continue providing free analytics and content to streamers and content creators.
                </p>
              </Section>

              <Section title="13. Contact Information">
                <p>
                  For questions about these Terms, please contact us at{' '}
                  <a href="mailto:shinypull@proton.me" className="text-indigo-600 hover:text-indigo-700">
                    shinypull@proton.me
                  </a>
                </p>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="text-gray-600 leading-relaxed">{children}</div>
    </section>
  );
}
