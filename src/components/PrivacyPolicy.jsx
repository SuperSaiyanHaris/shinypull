import React from 'react';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = ({ onBack }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-effect rounded-2xl p-8 border border-adaptive">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-adaptive-secondary hover:text-adaptive-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <h1 className="text-4xl font-display text-adaptive-primary mb-2">Privacy Policy</h1>
        <p className="text-adaptive-secondary">Last updated: January 2025</p>
      </div>

      {/* Content */}
      <div className="glass-effect rounded-2xl p-8 border border-adaptive space-y-8">
        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">1. Introduction</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            ShinyPull ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this policy carefully. By using the Site, you consent to the practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">2. Information We Collect</h2>
          <p className="text-adaptive-secondary leading-relaxed mb-4">
            We may collect information about you in various ways:
          </p>
          <h3 className="text-lg font-semibold text-adaptive-primary mb-2">Personal Data</h3>
          <p className="text-adaptive-secondary leading-relaxed mb-4">
            When you register for an account or use certain features, we may collect personally identifiable information such as your email address and IP address.
          </p>
          <h3 className="text-lg font-semibold text-adaptive-primary mb-2">Usage Data</h3>
          <p className="text-adaptive-secondary leading-relaxed">
            We automatically collect certain information when you visit the Site, including your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the Site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">3. How We Use Your Information</h2>
          <p className="text-adaptive-secondary leading-relaxed mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside text-adaptive-secondary space-y-2">
            <li>Provide, operate, and maintain our website</li>
            <li>Improve, personalize, and expand our website</li>
            <li>Understand and analyze how you use our website</li>
            <li>Develop new products, services, features, and functionality</li>
            <li>Communicate with you for customer service and support</li>
            <li>Send you updates and other information relating to the website</li>
            <li>Prevent fraudulent activity and improve security</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">4. Sharing Your Information</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            ShinyPull does not share identifiable user information with third parties. Your data is used solely for the administration of the site and management of your account. We may share anonymized, aggregated data for analytical purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">5. Cookies and Tracking Technologies</h2>
          <p className="text-adaptive-secondary leading-relaxed mb-4">
            We may use cookies, web beacons, and similar tracking technologies to collect and store information about your use of the Site. Cookies are small data files stored on your device that help us improve our Site and your experience.
          </p>
          <p className="text-adaptive-secondary leading-relaxed">
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">6. Third-Party Advertising</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            We may use third-party advertising companies to serve ads when you visit our Site. These companies may use information about your visits to this and other websites to provide relevant advertisements. We do not provide personally identifiable information to advertisers. Advertisers may collect IP addresses and use cookies to track ad exposure and browsing history.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">7. Analytics</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            We may use third-party analytics services such as Google Analytics and Vercel Analytics to analyze the use of our website. These services collect information about how you use the Site, which helps us create reports and improve the user experience. The information gathered is used to understand user behavior and improve our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">8. Data Retention</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            We will retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy. We may retain and use your information to comply with legal obligations, resolve disputes, and enforce our agreements.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">9. Account Deletion</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            You may request deletion of your account by contacting us. Please use the email address associated with your account for verification purposes. Even if your account is deleted, we may retain anonymized data for business and analytical purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">10. Security</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            We use administrative, technical, and physical security measures to protect your personal information. While we have taken reasonable steps to secure the information you provide to us, please be aware that no security measures are perfect, and we cannot guarantee the absolute security of your data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">11. Children's Privacy</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            Our Site is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete such information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">12. Changes to This Privacy Policy</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date at the top of this page. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">13. Contact Us</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            If you have questions or concerns about this Privacy Policy, please contact us through our website.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
