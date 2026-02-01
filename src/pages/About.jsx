import SEO from '../components/SEO';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <>
      <SEO 
        title="About Us"
        description="Learn about Shiny Pull - the leading social media analytics platform for tracking YouTube, Twitch, and other creator statistics."
      />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">About Shiny Pull</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-gray-300 mb-6">
            Shiny Pull is a comprehensive social media analytics platform that provides real-time statistics 
            and insights for content creators across multiple platforms including YouTube, Twitch, TikTok, 
            Instagram, and Twitter.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Our Mission</h2>
          <p className="text-gray-300 mb-6">
            We believe in transparency and accessibility of social media data. Our mission is to empower 
            creators, marketers, and fans with accurate, up-to-date analytics to make informed decisions 
            and track growth across platforms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What We Offer</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
            <li>Real-time subscriber and follower counts</li>
            <li>Historical growth tracking and trends</li>
            <li>Earnings estimates based on industry standards</li>
            <li>Rankings and leaderboards across platforms</li>
            <li>Channel comparison tools</li>
            <li>Daily statistics collection</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Data Sources</h2>
          <p className="text-gray-300 mb-6">
            All data is collected directly from official platform APIs including YouTube Data API v3 
            and Twitch Helix API. We collect statistics daily to provide accurate historical trends 
            and growth analytics.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
          <p className="text-gray-300 mb-6">
            Have questions or feedback? <Link to="/contact" className="text-blue-500 hover:text-blue-400">Get in touch</Link> with our team.
          </p>
        </div>
      </div>
    </>
  );
}
