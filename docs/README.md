# TCG Price Tracker

A modern, progressive web app for tracking trading card game prices across multiple platforms.

## ✨ Features (MVP)

- 🔍 **Real-time Search** - Instant card search with debouncing
- 💰 **Multi-Platform Pricing** - Compare prices from TCGPlayer, eBay, and Cardmarket
- 📊 **Price Trends** - Visual indicators for price movement
- 📱 **PWA Support** - Install on any device (iPhone, Android, Desktop)
- ⚡ **Lightning Fast** - Built with Vite for optimal performance
- 🎨 **Modern UI** - Clean, distinctive design with smooth animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (download from https://nodejs.org/)
- npm or yarn

### Installation

1. **Navigate to project directory**
   ```bash
   cd tcg-price-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - The app will hot-reload as you make changes

### Build for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

## 📁 Project Structure

```
tcg-price-tracker/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── SearchBar.jsx
│   │   ├── CardGrid.jsx
│   │   ├── CardItem.jsx
│   │   └── Stats.jsx
│   ├── hooks/          # Custom React hooks
│   │   └── useCardSearch.js
│   ├── services/       # API services
│   │   └── cardService.js  # MOCK DATA - Replace with real API
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles + Tailwind
├── index.html
├── package.json
├── vite.config.js      # Vite + PWA configuration
└── tailwind.config.js  # Tailwind customization
```

## 🔌 API Integration

### Current Status: MOCK DATA

The app currently uses mock data in `src/services/cardService.js`. To integrate real APIs:

### Option 1: TCGPlayer API (Recommended)

1. **Sign up** at https://tcgplayer.com/
2. **Get API credentials** from developer portal
3. **Update cardService.js**:

```javascript
const TCGPLAYER_API = 'https://api.tcgplayer.com/v1.39.0';
const API_KEY = 'your-api-key';

export const searchCards = async (query) => {
  const response = await fetch(
    `${TCGPLAYER_API}/catalog/products?name=${query}&categoryId=3`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.json();
};
```

### Option 2: Pokemon TCG API (Free, No Auth Required)

```javascript
const POKEMON_API = 'https://api.pokemontcg.io/v2';

export const searchCards = async (query) => {
  const response = await fetch(
    `${POKEMON_API}/cards?q=name:${query}`
  );
  const data = await response.json();
  return data.data;
};
```

### Option 3: eBay API

1. Sign up at https://developer.ebay.com/
2. Get API credentials
3. Implement OAuth 2.0 flow

## 🎯 Roadmap

### Phase 1: MVP ✅ (Current)
- [x] Basic search functionality
- [x] Card display with pricing
- [x] Responsive design
- [x] PWA configuration
- [ ] **Connect to real API**
- [ ] Deploy to production

### Phase 2: Enhancement
- [ ] Price history charts (using Recharts - already included!)
- [ ] Advanced filtering (rarity, set, price range)
- [ ] Favorite/watchlist cards (localStorage)
- [ ] Dark/light mode toggle
- [ ] Share card links

### Phase 3: User Accounts
- [ ] User authentication (Firebase/Supabase)
- [ ] Personal card collection tracking
- [ ] Price alerts via email/push notifications
- [ ] Portfolio value calculator

### Phase 4: Expansion
- [ ] Add Magic: The Gathering
- [ ] Add Yu-Gi-Oh!
- [ ] Add One Piece TCG
- [ ] Advanced analytics dashboard
- [ ] API for developers

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (#0ea5e9 → #7dd3fc)
- **Accent**: Yellow (#facc15)
- **Background**: Dark slate with gradient overlay
- **Glass Effects**: Translucent backgrounds with blur

### Typography
- **Display**: DM Serif Display (headings)
- **Body**: Work Sans (text)
- **Mono**: JetBrains Mono (code/numbers)

### Components
All components follow the frontend-design skill guidelines:
- Bold, distinctive aesthetics
- Smooth animations and transitions
- Glass morphism effects
- Responsive and accessible

## 📱 PWA Features

The app is configured as a Progressive Web App:

- **Installable** on iOS, Android, and Desktop
- **Offline support** with service workers
- **Fast loading** with intelligent caching
- **App-like experience** with splash screens

### Installing on iPhone
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"

### Installing on Android
1. Open in Chrome
2. Tap menu (⋮)
3. Select "Install App"

## 🚢 Deployment Options

### Vercel (Recommended for Frontend)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Railway (For Full Stack)
1. Connect GitHub repo
2. Auto-deploys on push

## 🔧 Environment Variables

Create a `.env` file in the root:

```env
VITE_TCGPLAYER_API_KEY=your_key_here
VITE_EBAY_API_KEY=your_key_here
VITE_API_BASE_URL=https://api.yourbackend.com
```

Access in code: `import.meta.env.VITE_TCGPLAYER_API_KEY`

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or change port in vite.config.js
```

### Build errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Images not loading
- Check CORS settings on image URLs
- Verify image URLs are HTTPS
- Add fallback images

## 📚 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Recharts** - Chart library (for price graphs)
- **Vite PWA Plugin** - Progressive Web App support

## 🤝 Contributing

This is a personal project, but feel free to:
1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - feel free to use this for your own projects!

## 🔗 Useful Resources

- [TCGPlayer API Docs](https://docs.tcgplayer.com/)
- [Pokemon TCG API](https://pokemontcg.io/)
- [eBay Developer Program](https://developer.ebay.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PWA Guidelines](https://web.dev/progressive-web-apps/)

## 💡 Next Steps

1. **Install dependencies**: Run `npm install`
2. **Start dev server**: Run `npm run dev`
3. **Connect real API**: Replace mock data in `cardService.js`
4. **Add price charts**: Implement Recharts for historical data
5. **Deploy**: Choose hosting platform and deploy
6. **Gather feedback**: Share with TCG community

---

**Built with ❤️ for the TCG community**
