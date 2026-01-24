import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfUse = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-effect rounded-2xl p-8 border border-adaptive">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-adaptive-secondary hover:text-adaptive-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <h1 className="text-4xl font-display text-adaptive-primary mb-2">Terms of Use</h1>
        <p className="text-adaptive-secondary">Last updated: January 2025</p>
      </div>

      {/* Content */}
      <div className="glass-effect rounded-2xl p-8 border border-adaptive space-y-8">
        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">1. Acceptance of Terms</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            By accessing and using ShinyPull ("the Site"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this Site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">2. Description of Service</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            ShinyPull provides Pokemon Trading Card Game price tracking and collection management tools. We aggregate pricing data from various sources to help users track the value of their collections. The Site is provided for informational purposes only.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">3. Copyright and Ownership</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            The organization, graphics, design, compilation, and all other matters related to the Site are protected under applicable copyrights, trademarks, and other proprietary rights. The copying, redistribution, use, or publication of any such matters or any part of the Site is prohibited without express written permission from ShinyPull.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">4. Automated Access Prohibited</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            You may not use any automated means, including robots, crawlers, scrapers, or similar tools, to access, collect, or interact with the Site's data without explicit written permission. This includes but is not limited to price data retrieval, images, and any other content on the Site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">5. Disclaimer of Warranties</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            The Site and all information, content, and materials available through it are provided on an "as is" and "as available" basis. ShinyPull makes no warranties, expressed or implied, and hereby disclaims all warranties including, without limitation, implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p className="text-adaptive-secondary leading-relaxed mt-4">
            Price data displayed on this Site is aggregated from third-party sources and may not be accurate, current, or complete. We do not guarantee the accuracy of any pricing information and recommend verifying prices before making purchasing decisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">6. Limitation of Liability</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            In no event shall ShinyPull be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, or goodwill, arising out of or in connection with your use of the Site, whether based on warranty, contract, tort, or any other legal theory, even if we have been advised of the possibility of such damages.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">7. Third-Party Links and Services</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            The Site may contain links to third-party websites, including merchant sites. ShinyPull is not responsible for the content, accuracy, or practices of any third-party sites. Any transactions you conduct with third-party merchants are solely between you and the merchant.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">8. Pokemon Trademark Notice</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            ShinyPull is not affiliated with, sponsored or endorsed by, or in any way associated with Pokemon or The Pokemon Company International Inc. All Pokemon images, names, and related marks are trademarks of their respective owners.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">9. Modifications to Terms</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            ShinyPull reserves the right to modify these terms at any time. We will notify users of any material changes by updating the "Last updated" date at the top of this page. Your continued use of the Site after any such changes constitutes your acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">10. Privacy Policy</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            Your use of the Site is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices regarding your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display text-adaptive-primary mb-4">11. Contact</h2>
          <p className="text-adaptive-secondary leading-relaxed">
            If you have any questions about these Terms of Use, please contact us through our website.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfUse;
