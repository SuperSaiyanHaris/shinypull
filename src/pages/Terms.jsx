import SEO from '../components/SEO';

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Read the ShinyPull Terms of Service to understand the rules and regulations for using our platform."
      />

      <div className="min-h-screen bg-[#0a0a0f] dot-grid">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-gray-800/60 py-16 bg-gradient-to-b from-gray-900/80 to-transparent">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold text-gray-100 mb-4">Terms of Service</h1>
            <p className="text-gray-400">Last updated: February 11, 2026</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-8">
            <div className="prose max-w-none">
              <p className="text-gray-300 mb-8 leading-relaxed">
                This is the terms of use agreement (the "Agreement") that governs your use of ShinyPull's website
                and data. If you do not agree with these terms, please stop using ShinyPull's website and refrain
                from using our data.
              </p>

              <Section title="General Terms">
                <p className="mb-4">
                  ShinyPull may change any of the terms and conditions in this Agreement at any time for any reason.
                  A notice of material change will be posted on ShinyPull's website, and you are responsible for
                  reviewing the changes. If you do not agree with them, do not continue to use ShinyPull's website
                  and refrain from using our data.
                </p>
                <p className="mb-4">
                  ShinyPull does not provide any guarantee or warranty of the accuracy of any data. By using
                  ShinyPull, you are certifying that you are over 13 years of age and have your legal guardian's
                  permission if you are under 18.
                </p>
                <p>
                  The data ShinyPull provides is public information. It is gathered by ShinyPull's proprietary
                  software from 3rd party sources. The data is then collated, organized, manipulated, and displayed
                  in unique ways by ShinyPull. This makes the data proprietary.
                </p>
              </Section>

              <Section title="Data Rights">
                <p className="mb-4">
                  Sharing ShinyPull's data, including screen shots or images of ShinyPull's website, is allowed
                  providing you credit ShinyPull as the source of said data and/or images. The acceptable way to
                  do this is to provide a link back to the source of the data, and clearly state in text that
                  ShinyPull provides the data. This includes sharing our data on social media websites, on blogs,
                  and in any sort of publication.
                </p>
                <p className="mb-4">
                  Data that is shared from ShinyPull on YouTube videos should include a link in the description,
                  and a verbal or written acknowledgement of ShinyPull as the source of the data in the video itself.
                </p>
                <p>
                  <strong>Mass copying data from ShinyPull's website (to include botting, crawling, scraping, etc.)
                  is not allowed</strong> and may result in you being blocked from ShinyPull's website and data.
                  The only way you may gather large amounts of data is by requesting data directly from ShinyPull
                  (email our staff at{' '}
                  <a href="mailto:shinypull@proton.me" className="text-indigo-600 hover:text-indigo-300">
                    shinypull@proton.me
                  </a>
                  ).
                </p>
              </Section>

              <Section title="Data Policy - Creator Profile Removal">
                <p className="mb-4">
                  <strong>It is ShinyPull's policy to not delete data on our website.</strong> All the data on our
                  website is gathered from public sources, and ShinyPull will continue to display said data. If you
                  want us to stop displaying the statistics of your channel/account from a third party (e.g. YouTube,
                  Twitch, TikTok, Kick), you will have to adjust your privacy settings on said third party website.
                </p>
                <p className="mb-4">
                  Again just to reinstate, the data shown on ShinyPull is the same public data anyone could get by
                  visiting your profile on various social media sites and writing it down. We do not display private
                  data. If we were to delete or change any of the data shown it would ruin our journalistic/encyclopedic
                  integrity.
                </p>
                <p>
                  <strong>If you want a private social media profile simply mark it as private on that site and we
                  won't collect its public data, otherwise we will.</strong>
                </p>
              </Section>

              <Section title="Data Sources">
                <p>
                  In order to keep statistical data updated, ShinyPull utilizes API services of third parties
                  including YouTube, TikTok, Twitch, and Kick. Unless specific access is asked for at time of
                  use (i.e. to validate your identity), we are only gathering publicly available data from each of
                  the API services, not anything private about your account. When private data is granted, collected
                  data via the private token isn't being stored, it is just being used to verify various things. If
                  you wish to revoke access you can do so via each platform's connected services page, or contact us
                  at{' '}
                  <a href="mailto:shinypull@proton.me" className="text-indigo-600 hover:text-indigo-300">
                    shinypull@proton.me
                  </a>{' '}
                  and we will delete the token from our system. If you wish to delete your account entirely including
                  all connected accounts, you can do so via the account settings page.
                </p>
              </Section>

              <Section title="Description of Service">
                <p>
                  ShinyPull provides social media analytics and statistics for content creators across multiple
                  platforms including YouTube, TikTok, Twitch, and Kick. We collect publicly available
                  data from official platform APIs.
                </p>
              </Section>

              <Section title="User Accounts">
                <p className="mb-2">When creating an account, you agree to:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>
              </Section>

              <Section title="Data Accuracy">
                <p>
                  While we strive to provide accurate statistics, we cannot guarantee 100% accuracy. Data is
                  collected from third-party APIs and may be subject to delays, errors, or inconsistencies.
                  Earnings estimates are approximations based on industry averages and should not be considered
                  exact figures.
                </p>
              </Section>

              <Section title="Live Counter Estimates">
                <p className="mb-4">
                  Our "Live Counter" feature displays <strong>estimated</strong> real-time subscriber and follower
                  counts. These numbers are simulations based on:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
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

              <Section title="Acceptable Use">
                <p className="mb-2">You agree NOT to:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>Use automated tools to scrape or download data without permission</li>
                  <li>Attempt to access unauthorized areas of the service</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Use the service for any unlawful purpose</li>
                  <li>Impersonate others or misrepresent your affiliation</li>
                </ul>
              </Section>

              <Section title="Intellectual Property">
                <p>
                  All content, features, and functionality of ShinyPull are owned by us and protected by
                  international copyright, trademark, and other intellectual property laws. Creator statistics
                  and public data are owned by their respective platforms and creators.
                </p>
              </Section>

              <Section title="Third-Party Platforms">
                <p>
                  Our service relies on third-party platform APIs (YouTube, TikTok, Twitch, Kick, etc.). We are
                  not affiliated with these platforms. Changes to their APIs or terms may affect our service.
                </p>
              </Section>

              <Section title="Limitation of Liability">
                <p>
                  ShinyPull is provided "as is" without warranties of any kind. We shall not be liable
                  for any indirect, incidental, special, consequential, or punitive damages resulting from
                  your use or inability to use the service.
                </p>
              </Section>

              <Section title="Service Modifications">
                <p>
                  We reserve the right to modify, suspend, or discontinue any part of our service at any
                  time without notice. We may also update these Terms of Service periodically.
                </p>
              </Section>

              <Section title="Termination">
                <p>
                  We may terminate or suspend your account and access to the service at our sole discretion,
                  without notice, for conduct that violates these Terms or is harmful to other users.
                </p>
              </Section>

              <Section title="Amazon Associates Disclosure">
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

              <Section title="Contact Information">
                <p>
                  For questions about these Terms, please contact us at{' '}
                  <a href="mailto:shinypull@proton.me" className="text-indigo-600 hover:text-indigo-300">
                    shinypull@proton.me
                  </a>
                </p>
              </Section>

              <p className="text-sm text-gray-300 mt-8">
                This Document is Effective as of February 11, 2026.
              </p>
            </div>
          </div>

          <div className="text-center text-sm text-gray-300 mt-8">
            <p>Copyright ©2026 ShinyPull</p>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-100 mb-4">{title}</h2>
      <div className="text-gray-300 leading-relaxed">{children}</div>
    </section>
  );
}
