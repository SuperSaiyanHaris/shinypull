import SEO from '../components/SEO';

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-100 mb-3">{title}</h2>
      <div className="text-gray-300 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function Refunds() {
  return (
    <>
      <SEO
        title="Refund Policy"
        description="ShinyPull's refund policy for Sub and Mod subscriptions."
      />

      <div className="min-h-screen bg-[#0a0a0f] dot-grid">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-gray-800/60 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold text-gray-100 mb-4">Refund Policy</h1>
            <p className="text-gray-400">Last updated: February 28, 2026</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-8">
            <div className="prose max-w-none">

              <Section title="Overview">
                <p>
                  ShinyPull offers monthly subscriptions (Sub at $6/month, Mod at $20/month). This policy
                  explains when you can get a refund and how to request one.
                </p>
              </Section>

              <Section title="7-Day Refund Window">
                <p>
                  If you subscribed for the first time and aren't satisfied, you can request a full refund
                  within 7 days of your initial payment. No questions asked.
                </p>
                <p>
                  This applies to your first subscription purchase only. Renewals and plan upgrades are
                  not eligible for the 7-day window.
                </p>
              </Section>

              <Section title="Cancellations">
                <p>
                  You can cancel your subscription at any time from your Account page. When you cancel,
                  your plan stays active until the end of the current billing period. You won't be charged
                  again after that.
                </p>
                <p>
                  Cancelling mid-cycle does not trigger a partial refund. Your access continues until
                  the period you already paid for ends.
                </p>
              </Section>

              <Section title="Renewals">
                <p>
                  Monthly renewals are not refundable once the billing date has passed and access for
                  that period has been granted.
                </p>
                <p>
                  If you forgot to cancel before a renewal, contact us within 48 hours and we'll
                  review it on a case-by-case basis.
                </p>
              </Section>

              <Section title="Exceptions">
                <p>
                  We'll consider refunds outside the standard window if there was a technical issue on
                  our end that prevented you from using the service. Reach out and describe the problem.
                </p>
                <p>
                  We don't issue refunds if you simply stopped using the service, forgot you had a
                  subscription, or found you didn't need the features.
                </p>
              </Section>

              <Section title="How to Request a Refund">
                <p>
                  Email us at <a href="mailto:shinypull@proton.me" className="text-indigo-400 hover:text-indigo-300">shinypull@proton.me</a> with
                  the subject line "Refund Request" and include the email address on your account.
                  We'll respond within 2 business days.
                </p>
                <p>
                  Approved refunds are processed back to your original payment method. Stripe typically
                  takes 5 to 10 business days to post the credit.
                </p>
              </Section>

              <Section title="Contact">
                <p>
                  Questions? Reach us at <a href="mailto:shinypull@proton.me" className="text-indigo-400 hover:text-indigo-300">shinypull@proton.me</a>.
                </p>
              </Section>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
