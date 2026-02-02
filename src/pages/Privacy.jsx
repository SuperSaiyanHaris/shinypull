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
            <p className="text-indigo-100">Last updated: February 1, 2026</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="prose max-w-none">
              <Section title="Introduction">
                <p>
                  ShinyPull ("we," "our," or "us") respects your privacy and is committed to protecting your
                  personal data. This privacy policy explains how we collect, use, and safeguard your information
                  when you use our service.
                </p>
              </Section>

              <Section title="Information We Collect">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h3>
                <p className="mb-4">When you create an account, we collect:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                  <li>Email address</li>
                  <li>Display name</li>
                  <li>Profile picture (if using Google Sign-In)</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Data</h3>
                <p className="mb-2">We automatically collect information about your interactions with our service:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Pages viewed</li>
                  <li>Creators searched</li>
                  <li>Time and date of visits</li>
                  <li>Browser type and version</li>
                </ul>
              </Section>

              <Section title="How We Use Your Information">
                <p className="mb-2">We use your information to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Provide and maintain our service</li>
                  <li>Create and manage your account</li>
                  <li>Improve and personalize your experience</li>
                  <li>Communicate with you about updates and features</li>
                  <li>Analyze usage patterns and trends</li>
                </ul>
              </Section>

              <Section title="Data Security">
                <p>
                  We implement industry-standard security measures to protect your personal information.
                  Your data is stored securely using Supabase, which provides enterprise-grade security
                  including encryption at rest and in transit.
                </p>
              </Section>

              <Section title="Third-Party Services">
                <p className="mb-2">We use the following third-party services:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Google OAuth for authentication</li>
                  <li>Supabase for data storage</li>
                  <li>Vercel for hosting</li>
                  <li>YouTube Data API and Twitch API for creator statistics</li>
                </ul>
              </Section>

              <Section title="Your Rights">
                <p className="mb-2">You have the right to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Export your data</li>
                </ul>
              </Section>

              <Section title="Cookies">
                <p>
                  We use cookies and similar tracking technologies to maintain your session and improve
                  your experience. You can control cookies through your browser settings.
                </p>
              </Section>

              <Section title="Contact Us">
                <p>
                  If you have questions about this Privacy Policy, please contact us at{' '}
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
