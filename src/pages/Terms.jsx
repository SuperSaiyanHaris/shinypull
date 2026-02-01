import SEO from '../components/SEO';

export default function Terms() {
  return (
    <>
      <SEO 
        title="Terms of Service"
        description="Read the Shiny Pull Terms of Service to understand the rules and regulations for using our platform."
      />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: February 1, 2026</p>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing and using Shiny Pull, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Description of Service</h2>
            <p className="text-gray-300">
              Shiny Pull provides social media analytics and statistics for content creators across multiple 
              platforms including YouTube, Twitch, TikTok, Instagram, and Twitter. We collect publicly available 
              data from official platform APIs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. User Accounts</h2>
            <p className="text-gray-300 mb-2">When creating an account, you agree to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Data Accuracy</h2>
            <p className="text-gray-300">
              While we strive to provide accurate statistics, we cannot guarantee 100% accuracy. Data is 
              collected from third-party APIs and may be subject to delays, errors, or inconsistencies. 
              Earnings estimates are approximations based on industry averages and should not be considered 
              exact figures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Acceptable Use</h2>
            <p className="text-gray-300 mb-2">You agree NOT to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Use automated tools to scrape or download data</li>
              <li>Attempt to access unauthorized areas of the service</li>
              <li>Interfere with or disrupt the service</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Use the service for any unlawful purpose</li>
              <li>Impersonate others or misrepresent your affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">6. Intellectual Property</h2>
            <p className="text-gray-300">
              All content, features, and functionality of Shiny Pull are owned by us and protected by 
              international copyright, trademark, and other intellectual property laws. Creator statistics 
              and public data are owned by their respective platforms and creators.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">7. Third-Party Platforms</h2>
            <p className="text-gray-300">
              Our service relies on third-party platform APIs (YouTube, Twitch, etc.). We are not 
              affiliated with these platforms. Changes to their APIs or terms may affect our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">8. Limitation of Liability</h2>
            <p className="text-gray-300">
              Shiny Pull is provided "as is" without warranties of any kind. We shall not be liable 
              for any indirect, incidental, special, consequential, or punitive damages resulting from 
              your use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">9. Service Modifications</h2>
            <p className="text-gray-300">
              We reserve the right to modify, suspend, or discontinue any part of our service at any 
              time without notice. We may also update these Terms of Service periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">10. Termination</h2>
            <p className="text-gray-300">
              We may terminate or suspend your account and access to the service at our sole discretion, 
              without notice, for conduct that violates these Terms or is harmful to other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">11. Governing Law</h2>
            <p className="text-gray-300">
              These Terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">12. Contact Information</h2>
            <p className="text-gray-300">
              For questions about these Terms, please contact us at{' '}
              <a href="mailto:shinypull@proton.me" className="text-blue-500 hover:text-blue-400">
                shinypull@proton.me
              </a>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
