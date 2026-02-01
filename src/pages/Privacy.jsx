import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <>
      <SEO 
        title="Privacy Policy"
        description="Learn how Shiny Pull collects, uses, and protects your personal information."
      />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: February 1, 2026</p>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">Introduction</h2>
            <p className="text-gray-300">
              Shiny Pull ("we," "our," or "us") respects your privacy and is committed to protecting your 
              personal data. This privacy policy explains how we collect, use, and safeguard your information 
              when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-2">Account Information</h3>
            <p className="text-gray-300 mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
              <li>Email address</li>
              <li>Display name</li>
              <li>Profile picture (if using Google Sign-In)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">Usage Data</h3>
            <p className="text-gray-300">
              We automatically collect information about your interactions with our service, including:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Pages viewed</li>
              <li>Creators searched</li>
              <li>Time and date of visits</li>
              <li>Browser type and version</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">How We Use Your Information</h2>
            <p className="text-gray-300 mb-2">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Provide and maintain our service</li>
              <li>Create and manage your account</li>
              <li>Improve and personalize your experience</li>
              <li>Communicate with you about updates and features</li>
              <li>Analyze usage patterns and trends</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Data Security</h2>
            <p className="text-gray-300">
              We implement industry-standard security measures to protect your personal information. 
              Your data is stored securely using Supabase, which provides enterprise-grade security 
              including encryption at rest and in transit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Third-Party Services</h2>
            <p className="text-gray-300 mb-2">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Google OAuth for authentication</li>
              <li>Supabase for data storage</li>
              <li>Vercel for hosting</li>
              <li>YouTube Data API and Twitch API for creator statistics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Your Rights</h2>
            <p className="text-gray-300 mb-2">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Cookies</h2>
            <p className="text-gray-300">
              We use cookies and similar tracking technologies to maintain your session and improve 
              your experience. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Contact Us</h2>
            <p className="text-gray-300">
              If you have questions about this Privacy Policy, please contact us at{' '}
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
