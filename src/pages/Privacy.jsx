import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Learn how Shiny Pull collects, uses, and protects your personal information."
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-indigo-100">Last updated: February 11, 2026</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="prose max-w-none">
              <Section title="Legal Notes">
                <p className="mb-4">
                  ShinyPull may change any of the terms and conditions in this Policy at any time for any reason.
                  A notice of material change will be posted on ShinyPull's website, and you are responsible for
                  reviewing the changes. If you do not agree with them, do not continue to use ShinyPull's website
                  and refrain from using our data.
                </p>
                <p>
                  By visiting our Site and/or using any of our Services, you agree to have your personal information
                  handled as per this Policy.
                </p>
              </Section>

              <Section title="Public Information">
                <p className="mb-4">
                  We can keep this privacy policy short, because at the end of the day ShinyPull isn't a private
                  data business. <strong>The data collected and shown on ShinyPull is public data.</strong>
                </p>
                <p>
                  ShinyPull can be considered a very thorough and diligent journalist. The data you see is the same
                  public data you'd see by visiting social media sites directly and notating down the follower count,
                  etc. that is displayed publicly there each day. If the information isn't shown publicly on those
                  websites, it's not collected or shown on our website either. Other than operating the site itself
                  as described below, we do not collect or store private information.
                </p>
              </Section>

              <Section title="Further Details">
                <p className="mb-4">
                  Just like the rest of the Internet we use cookies. Cookies aren't evil, they're the way you can
                  log into a website once and stay logged in until you log out instead of typing your login/password
                  on every page.
                </p>
                <p className="mb-4">
                  You come to ShinyPull for analytics. Analytics also helps us know how many people are using the
                  site, which parts of the site you use the most often, etc. It helps us build out things you're
                  interested in and not focus on things you're not. Google Analytics and other analytics tools we
                  may use from time to time also aren't evil. Without things like this we wouldn't know how to help you.
                </p>
                <p>
                  We provide many of our services free of charge. If you don't like ads, we may offer paid
                  subscriptions in the future to remove them.
                </p>
              </Section>

              <Section title="Private Data">
                <p className="mb-4">What private information do we have? In short, not much.</p>
                <p className="mb-4">
                  If you create an account with us you do so with an email address and password. This password is
                  encrypted in our database in a way that no one can see what it is, not even us. That said we
                  recommend you don't use the same password you use on other sites because we can't guarantee the
                  other sites will follow the same practices.
                </p>
                <p className="mb-4">
                  If you have paid for one of our services, then the email associated with that as well as your
                  name is also on file. Your credit card details are only handled by our payment processors
                  (PayPal and Stripe), not us.
                </p>
                <p className="mb-4">
                  If you authenticate your social media account with us, we have an authorization token that
                  creates this connection. We never store nor even have access to your password of third party services.
                </p>
                <p className="mb-4">
                  Lastly, the way the internet works is every visit to any website has an IP address associated
                  with it so we have that too associated with your account. This is critical for preventing fraud.
                </p>
                <p>
                  To end this section, we want to be abundantly clear, <strong>the private data mentioned above is
                  to operate the website. We do not sell or even give away private data.</strong>
                </p>
              </Section>

              <Section title="Private Data Removal">
                <p className="mb-4">
                  As detailed in the previous section there are two types of private data. Information to create
                  and maintain your account which is all or nothing, and also if you've authenticated your third
                  party social media account, an authorization token for that.
                </p>
                <p className="mb-4">
                  To remove the authorization token for third party authenticated accounts you can do so in three
                  different, equally good ways: 1) At that third party site via their own tools 2) In your dashboard
                  in the authenticated accounts section or 3) by contacting us at{' '}
                  <a href="mailto:shinypull@proton.me" className="text-indigo-600 hover:text-indigo-700">
                    shinypull@proton.me
                  </a>{' '}
                  and responding to any follow up questions needed to authenticate you. No matter what method you
                  chose that is all you need to do. There is nothing else to delete as we're not collecting private
                  data from your third party account.
                </p>
                <p className="mb-4">
                  To remove your account entirely including all connected accounts, you can do so via your account
                  settings page.
                </p>
                <p className="mb-2">ShinyPull may share your information for the following reasons:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                  <li>We may disclose the information we collect from you to comply with the law, a court order, or other legal process.</li>
                  <li>We may disclose the information we collect from you where we believe it is necessary to investigate, or prevent illegal activities, suspected fraud, situations involving potential threats to the safety of any person, violations of our Terms of Use or this Policy, or as evidence in litigation in which we are involved.</li>
                  <li>We may share aggregate information about users with third parties for marketing, advertising, research, or similar purposes.</li>
                </ul>
              </Section>

              <Section title="Third-Party Links">
                <p>
                  ShinyPull's Site includes links to third-party websites. Access to and use of linked websites is
                  governed by those third-party websites' privacy policies. ShinyPull is not responsible for their
                  information practices.
                </p>
              </Section>

              <Section title="Data Sources">
                <p>
                  In order to keep statistical data updated, ShinyPull utilizes API services of third parties
                  including YouTube, TikTok, Twitch, and Kick. We only gather publicly available data from each
                  of the API services, not anything private about your account.
                </p>
              </Section>

              <Section title="Contact Us">
                <p>
                  If you have questions about this Privacy Policy, please reach out at{' '}
                  <a href="mailto:shinypull@proton.me" className="text-indigo-600 hover:text-indigo-700">
                    shinypull@proton.me
                  </a>
                </p>
              </Section>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mt-8">
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
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="text-gray-600 leading-relaxed">{children}</div>
    </section>
  );
}
