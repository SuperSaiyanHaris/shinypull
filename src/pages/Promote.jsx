import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Megaphone, Trophy, Sparkles, TrendingUp, Shield, ArrowRight,
  Check, BarChart3, Users, Eye,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import CountUp from '../components/CountUp';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * /promote, public landing page for Featured Listings.
 * Explains the product to potential B2B buyers without requiring auth.
 * "Get a featured listing" CTA → /account?tab=listings (auth gate downstream).
 */
export default function Promote() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({ creators: 0, dailyVisitors: 12000 });

  useEffect(() => {
    supabase.from('creators').select('*', { count: 'exact', head: true })
      .then(r => setStats((s) => ({ ...s, creators: r.count || 0 })))
      .catch(() => {});
  }, []);

  const ctaHref = isAuthenticated ? '/account?tab=listings' : '/account?tab=listings';

  return (
    <>
      <SEO
        title="Featured Listings: Promote Your Creators on ShinyPull"
        description="Get your creator featured in our daily rankings. $49/mo for visibility across YouTube, TikTok, Twitch, Kick, Bluesky and Music rankings. Premium slots from $149/mo."
        keywords="creator promotion, sponsored ranking, featured listing, B2B creator marketing, talent promotion, agency tools"
      />

      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-gray-800/60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.06),transparent_50%)]" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <Megaphone className="w-3.5 h-3.5" />
                Featured Listings
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-gray-100 mb-5 tracking-tight leading-[1.1]">
                Put your creator in front of <span className="text-amber-400">the people watching the data</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-9 max-w-2xl mx-auto leading-relaxed">
                Get featured directly in our live rankings across every platform we track. Visibility next to MrBeast, Ninja, Charli D'Amelio. Cancel anytime.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to={ctaHref}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Get featured
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/rankings"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-semibold rounded-xl transition-all duration-200"
                >
                  See live rankings
                </Link>
              </div>

              {/* Quick stats strip */}
              <div className="mt-12 grid grid-cols-3 max-w-2xl mx-auto rounded-2xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm overflow-hidden">
                {[
                  { label: 'Creators tracked', value: stats.creators, format: 'number' },
                  { label: 'Platforms covered', value: 6, format: 'number' },
                  { label: 'Pages per day', value: stats.dailyVisitors, format: 'number' },
                ].map((s, i) => (
                  <div key={s.label} className={`p-4 sm:p-6 text-center ${i !== 2 ? 'border-r border-gray-800' : ''}`}>
                    <p className="text-2xl sm:text-3xl font-extrabold text-gray-100 tabular-nums">
                      <CountUp value={s.value} format={s.format} />{s.label === 'Pages per day' && '+'}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing tiers */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100">Two ways to get featured</h2>
            <p className="mt-3 text-gray-400 text-base sm:text-lg">Pick the slot. Pick the platform. Live in minutes.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
            {/* Basic */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-indigo-500/60 rounded-2xl p-7 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Basic</span>
                </div>
                <p className="text-4xl font-extrabold text-gray-100 mt-3">$49<span className="text-base font-normal text-gray-500">/mo</span></p>
                <p className="text-sm text-gray-400 mt-4 mb-6">Placed starting at rank 15, then every 5 rows. Visible on the rankings page anyone hits looking for top creators.</p>
                <ul className="space-y-2.5 mb-7">
                  {[
                    'Rank 15, 20, 25, 30... on your chosen platform',
                    'Shows on both desktop and mobile rankings',
                    'Marked as "Sponsored". Clear and honest.',
                    'Cancel anytime',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={ctaHref}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 group-hover:gap-3 transition-all"
                >
                  Get a Basic slot <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative overflow-hidden bg-gradient-to-br from-amber-950/40 via-gray-900 to-gray-900 border border-amber-700/40 hover:border-amber-500/60 rounded-2xl p-7 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/15"
            >
              <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl group-hover:bg-amber-500/25 transition-colors duration-500" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider">⭐ Premium</span>
                  <span className="text-[10px] text-amber-400/80 font-semibold">Only 2 slots / platform</span>
                </div>
                <p className="text-4xl font-extrabold text-gray-100 mt-3">$149<span className="text-base font-normal text-gray-400">/mo</span></p>
                <p className="text-sm text-gray-300 mt-4 mb-6">Top-of-page placement between ranks 4-5 and 9-10. The first thing readers see when comparing top creators.</p>
                <ul className="space-y-2.5 mb-7">
                  {[
                    'Between rank 4-5 and 9-10, top of fold visibility',
                    'Golden card treatment, ⭐ Premium label',
                    'Maximum 2 slots per platform. Scarce inventory.',
                    'Cancel anytime',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-200">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={ctaHref}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300 group-hover:gap-3 transition-all"
                >
                  Get a Premium slot <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-900/40 border-y border-gray-800/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100">How it works</h2>
              <p className="mt-3 text-gray-400 text-base sm:text-lg">Live in under a minute.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { Icon: Users,      title: 'Pick a creator',       body: 'Search any creator across our 6 platforms. If they\'re tracked here, they\'re eligible.', accent: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-500/30' },
                { Icon: Megaphone,  title: 'Choose your slot',     body: 'Basic ($49) for steady visibility starting at rank 15. Premium ($149) for top-of-page placement.', accent: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30' },
                { Icon: TrendingUp, title: 'Live in minutes',      body: 'Stripe Checkout. Confirmation, then your creator appears on the live rankings page right away.', accent: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30' },
              ].map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden group hover:border-gray-700 transition-colors"
                >
                  <span className="absolute top-4 right-4 text-3xl font-black text-gray-800/80 group-hover:text-gray-700 transition-colors">0{i + 1}</span>
                  <div className={`w-11 h-11 bg-gradient-to-br ${step.accent} rounded-xl flex items-center justify-center shadow-lg ${step.shadow} mb-4`}>
                    <step.Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-100 mb-1.5">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100 text-center mb-10">FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I feature someone who isn\'t in your database?',
                a: 'For YouTube, Twitch, Kick, Bluesky, and Music: we add new creators continuously. If they aren\'t tracked yet, request them via the Search page. For TikTok, the Listings page has an instant-add flow that pulls their profile in seconds.',
              },
              {
                q: 'How is this different from a regular ad?',
                a: 'Featured Listings appear inside our actual ranked tables, not in display banner slots. People are already reading those rows when they look up creators, so attention is built-in.',
              },
              {
                q: 'Are featured slots labeled?',
                a: 'Yes. Basic shows as "Sponsored" and Premium shows as "⭐ Premium". We don\'t hide that they\'re paid placements. Clarity makes the format trustworthy.',
              },
              {
                q: 'Can I cancel?',
                a: 'Anytime, from the Listings tab in your account. Cancellation stops the next renewal. Your placement stays active through the end of the current billing period.',
              },
              {
                q: 'Do you offer agency or multi-creator deals?',
                a: 'Email shinypull@proton.me. We can set up agency billing and multi-slot discounts for talent management firms.',
              },
            ].map((item) => (
              <div key={item.q} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-gray-100 mb-1.5">{item.q}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-gray-800/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100 mb-3">Ready to get featured?</h2>
            <p className="text-base text-gray-400 mb-6 max-w-xl mx-auto">Most listings go live in under 60 seconds.</p>
            <Link
              to={ctaHref}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              Start now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
