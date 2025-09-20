# 🎲 HILO Casino

A modern, production-ready mock gambling site themed around dice rolls and high/low bets. Built with React, TypeScript, and Framer Motion for a premium gaming experience.

## ⚠️ Important Disclaimer

**This is a MOCK gambling website created for demonstration purposes only.**

- No real money is involved
- All transactions and winnings are simulated
- Created for educational and portfolio purposes
- Please do not use this as a basis for real gambling activities

## 🎨 Branding & Design

### Color Palette
- **Red**: `#FF2D2D` - High bets and alerts
- **Gold**: `#FFD700` - Primary brand color and highlights
- **Green**: `#00C853` - Low bets and success states
- **Black**: `#0D0D0D` - Background and dark elements

### Design Philosophy
Casino meets sleek fintech with glowing accents, bold typography, and smooth animations.

## 🚀 Features

### Core Pages
- **Home Page** - Hero section with HILO branding and call-to-action
- **Game Page** - Interactive dice game with betting interface
- **Leaderboard** - Mock leaderboard with top players
- **Provably Fair** - Explanation and verification system
- **About** - Disclaimer and platform information

### Key Features
- 🎲 **Animated Dice Rolling** - Physics-like roll animations with Framer Motion
- 💰 **Mock Wallet System** - Connect/disconnect with simulated balance
- 🛡️ **Provably Fair Demo** - Transparent game verification system
- 📱 **Mobile-First Design** - Responsive across all devices
- 🎨 **Modern UI/UX** - Smooth animations and micro-interactions
- 🏆 **Leaderboard System** - Competitive player rankings
- ⚡ **Instant Payouts** - Simulated instant win/loss results

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library
- **React Router** - Client-side routing

### State Management
- **Zustand** - Lightweight state management

### Testing
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing
- **jsdom** - DOM environment for tests

### Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── HiloLogo.tsx    # Animated HILO logo
│   ├── WalletButton.tsx # Wallet connect/disconnect
│   ├── DiceRoller.tsx  # Animated dice component
│   ├── Navigation.tsx  # Main navigation
│   └── Footer.tsx      # Site footer
├── pages/              # Page components
│   ├── HomePage.tsx    # Landing page
│   ├── GamePage.tsx    # Dice game interface
│   ├── LeaderboardPage.tsx # Player rankings
│   ├── ProvablyFairPage.tsx # Fair gaming info
│   └── AboutPage.tsx   # About and disclaimer
├── store/              # State management
│   └── gameStore.ts    # Zustand store
├── lib/                # Utility functions
│   └── utils.ts        # Helper functions
├── hooks/              # Custom React hooks
├── styles/             # Global styles
└── test/               # Test setup
    └── setup.ts        # Test configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (latest LTS version)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hilo-casino
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
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## 🎮 How to Play

1. **Connect Wallet** - Click the wallet button to connect (mock)
2. **Set Bet Amount** - Enter your desired bet or use quick bet buttons
3. **Choose Side** - Select HIGH (4-6) or LOW (1-3)
4. **Roll Dice** - Click the roll button to start the game
5. **View Results** - See if you won or lost with animated feedback
6. **Check History** - View your recent games in the sidebar

## 🛡️ Provably Fair System

Our mock provably fair system demonstrates transparency:

1. **Server Seed** - Generated before any game starts
2. **Client Seed** - You can provide your own or use random
3. **Nonce** - Incremental counter for each game
4. **Hash Generation** - Seeds combined to create game result
5. **Verification** - Verify any game result independently

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests in watch mode
npm run test -- --watch
```

## 📱 Responsive Design

The app is fully responsive and optimized for:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktops (1024px+)
- Large screens (1440px+)

## 🎨 Customization

### Colors
Update the color palette in `tailwind.config.js`:

```javascript
colors: {
  'hilo-red': '#FF2D2D',
  'hilo-gold': '#FFD700',
  'hilo-green': '#00C853',
  'hilo-black': '#0D0D0D',
}
```

### Animations
Modify animations in `tailwind.config.js` or component files using Framer Motion.

## 🤝 Contributing

This is a demonstration project, but contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Framer Motion for smooth animations
- Tailwind CSS for utility-first styling
- Vite for the fast build tool
- All open-source contributors

---

**Remember: This is a mock gambling site for demonstration purposes only. No real money is involved.**
