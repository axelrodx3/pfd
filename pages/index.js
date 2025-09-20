import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function Home() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [accountDropdown, setAccountDropdown] = useState(false)
  // ADD THIS LINE:
  const [isDarkMode, setIsDarkMode] = useState(true) // Start in dark mode

  return (
    <>
      <Head>
        <title>HILO - Premium Gaming Platform</title>
        <meta name="description" content="HILO - Premium gaming platform with dice, slots, and more" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="app">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <div className="logo">
              <span className="logo-icon">🎲</span>
              <span className="logo-text">HILO</span>
            </div>
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>

          <div className="sidebar-content">
            <div className="sidebar-section">
              <h3>Games</h3>
              <div className="sidebar-items">
                <div className="sidebar-item active">
                  <span className="item-icon">🎲</span>
                  <span className="item-text">Dice</span>
                </div>
                <div className="sidebar-item">
                  <span className="item-icon">��</span>
                  <span className="item-text">Slots</span>
                </div>
                <div className="sidebar-item">
                  <span className="item-icon">��</span>
                  <span className="item-text">Poker</span>
                </div>
                <div className="sidebar-item">
                  <span className="item-icon">🎯</span>
                  <span className="item-text">Roulette</span>
                </div>
                <div className="sidebar-item">
                  <span className="item-icon">⚽</span>
                  <span className="item-text">Sports</span>
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Favorites</h3>
              <div className="sidebar-items">
                <div className="sidebar-item">
                  <span className="item-icon">⭐</span>
                  <span className="item-text">Lucky Dice</span>
                </div>
                <div className="sidebar-item">
                  <span className="item-icon">⭐</span>
                  <span className="item-text">Mega Slots</span>
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Recent</h3>
              <div className="sidebar-items">
                <div className="sidebar-item">
                  <span className="item-icon">��</span>
                  <span className="item-text">Classic Dice</span>
                </div>
                <div className="sidebar-item">
                  <span className="item-icon">🕒</span>
                  <span className="item-text">Blackjack</span>
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Challenges</h3>
              <div className="sidebar-items">
                <div className="sidebar-item challenge">
                  <span className="item-icon">🏆</span>
                  <span className="item-text">Daily Challenge</span>
                  <span className="challenge-badge">+$50</span>
                </div>
                <div className="sidebar-item challenge">
                  <span className="item-icon">🎯</span>
                  <span className="item-text">Win Streak</span>
                  <span className="challenge-badge">+$100</span>
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Recent Games</h3>
              <div className="sidebar-items">
                <div className="recent-game">
                  <div className="recent-info">
                    <span className="recent-name">Dice Win</span>
                    <span className="recent-amount win">+$25</span>
                  </div>
                  <span className="recent-time">2m ago</span>
                </div>
                <div className="recent-game">
                  <div className="recent-info">
                    <span className="recent-name">Slots Loss</span>
                    <span className="recent-amount lose">-$10</span>
                  </div>
                  <span className="recent-time">5m ago</span>
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <h3>New Releases</h3>
              <div className="sidebar-items">
                <div className="sidebar-item new">
                  <span className="item-icon">🆕</span>
                  <span className="item-text">Crypto Dice</span>
                </div>
                <div className="sidebar-item new">
                  <span className="item-icon">🔥</span>
                  <span className="item-text">Lightning Roulette</span>
                </div>
                <div className="sidebar-item new">
                  <span className="item-icon">��</span>
                  <span className="item-text">Diamond Slots</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Header */}
          <header className="header">
            <div className="header-left">
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                ☰
              </button>
              <div className="breadcrumb">
                <span>Home</span>
                <span className="separator">/</span>
                <span>{currentPage === 'landing' ? 'Dashboard' : currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}</span>
              </div>
            </div>

              <div className="header-right">
              <div className="balance-display">
                <span className="balance-label">Balance</span>
                <span className="balance-amount">$<span id="balance">1000</span></span>
              </div>

              <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
                {isDarkMode ? '☀️' : '🌙'}
              </button>

              <div className="account-dropdown">
                <button className="account-btn" onClick={() => setAccountDropdown(!accountDropdown)}>
                  <div className="avatar">👤</div>
                  <span>Account</span>
                  <span className="dropdown-arrow">▼</span>
                </button>

                {accountDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item">
                      <span className="dropdown-icon">👤</span>
                      <span>Profile</span>
                    </div>
                    <div className="dropdown-item">
                      <span className="dropdown-icon">⚙️</span>
                      <span>Settings</span>
                    </div>
                    <div className="dropdown-item">
                      <span className="dropdown-icon">💳</span>
                      <span>Deposits</span>
                    </div>
                    <div className="dropdown-item">
                      <span className="dropdown-icon">💰</span>
                      <span>Withdrawals</span>
                    </div>
                    <div className="dropdown-item">
                      <span className="dropdown-icon">📊</span>
                      <span>Statistics</span>
                    </div>
                    <div className="dropdown-item">
                      <span className="dropdown-icon">🎁</span>
                      <span>Bonuses</span>
                    </div>
                    <div className="dropdown-item">
                      <span className="dropdown-icon">📞</span>
                      <span>Support</span>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item logout">
                      <span className="dropdown-icon">🚪</span>
                      <span>Logout</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="page-content">
            {currentPage === 'landing' && <LandingPage setCurrentPage={setCurrentPage} />}
            {currentPage === 'dice' && <DiceGame />}
          </div>
        </div>
      </div>

      <style jsx>{`
                * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --bg-primary: ${isDarkMode ? '#0f0f0f' : '#ffffff'};
          --bg-secondary: ${isDarkMode ? '#1a1a1a' : '#f8f9fa'};
          --bg-tertiary: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          --text-primary: ${isDarkMode ? '#ffffff' : '#000000'};
          --text-secondary: ${isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};
          --text-muted: ${isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};
          --border-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          --shadow-color: ${isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'};
        }

         body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: ${isDarkMode ? 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%)'} !important;
          color: var(--text-primary);
          overflow-x: hidden;
          transition: all 0.3s ease;
          min-height: 100vh;
        }

        .app {
          display: flex;
          min-height: 100vh;
        }

        /* Theme Toggle Styles */
        .theme-toggle {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          width: 40px;
          height: 40px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          margin-right: 16px;
        }

        .theme-toggle:hover {
          background: var(--border-color);
          transform: scale(1.05);
        }

        .sidebar {
          width: 280px;
          background: ${isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)'};
          backdrop-filter: blur(20px);
          border-right: 1px solid var(--border-color);
          transition: all 0.3s ease;
          position: fixed;
          height: 100vh;
          z-index: 1000;
          overflow-y: auto;
        }

        .sidebar.closed {
          width: 60px;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          font-size: 1.5rem;
          filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5));
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sidebar.closed .logo-text {
          display: none;
        }

        .sidebar-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .sidebar-content {
          padding: 20px;
        }

        .sidebar-section {
          margin-bottom: 32px;
        }

        .sidebar-section h3 {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          padding-left: 4px;
        }

        .sidebar.closed .sidebar-section h3 {
          display: none;
        }

        .sidebar-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .sidebar.closed .sidebar-item {
          justify-content: center;
          padding: 12px;
        }

        .sidebar.closed .item-text {
          display: none;
        }

        .sidebar-item:hover {
          background: var(--bg-tertiary);
        }

        .sidebar-item.active {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(255, 215, 0, 0.2) 100%);
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .sidebar-item.challenge {
          border: 1px solid rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.05);
        }

        .sidebar-item.new {
          border: 1px solid rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
        }

        .item-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .item-text {
          font-size: 0.9rem;
          font-weight: 500;
          flex: 1;
        }

        .challenge-badge {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .recent-game {
          padding: 8px 16px;
          border-radius: 8px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          margin-bottom: 8px;
        }

        .recent-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .recent-name {
          font-size: 0.85rem;
          font-weight: 500;
        }

        .recent-amount {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .recent-amount.win {
          color: #22c55e;
        }

        .recent-amount.lose {
          color: #ef4444;
        }

        .recent-time {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Main Content Styles */
        .main-content {
          flex: 1;
          margin-left: 280px;
          transition: margin-left 0.3s ease;
        }

        .sidebar.closed + .main-content {
          margin-left: 60px;
        }

        .header {
          background: ${isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.95)'};
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          padding: 20px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .mobile-menu-btn {
          display: none;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          width: 40px;
          height: 40px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1.2rem;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

         .separator {
          color: var(--text-muted);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .balance-display {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .balance-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 2px;
        }

        .balance-amount {
          font-size: 1.2rem;
          font-weight: 700;
          color: #d4af37;
        }

        .account-dropdown {
          position: relative;
        }

         .account-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .account-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .dropdown-arrow {
          font-size: 0.8rem;
          transition: transform 0.3s ease;
        }

        .account-dropdown.open .dropdown-arrow {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: ${isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)'};
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 8px;
          min-width: 200px;
          box-shadow: 0 20px 40px var(--shadow-color);
          z-index: 1000;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .dropdown-item.logout {
          color: #ef4444;
        }

        .dropdown-item.logout:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .dropdown-icon {
          font-size: 1rem;
          width: 16px;
          text-align: center;
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 8px 0;
        }

        .page-content {
          padding: 32px;
          min-height: calc(100vh - 80px);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            width: 280px;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .main-content {
            margin-left: 0;
          }

          .mobile-menu-btn {
            display: block;
          }

          .header {
            padding: 16px 20px;
          }

          .page-content {
            padding: 20px;
          }

          .balance-display {
            display: none;
          }
        }
      `}</style>

      <script dangerouslySetInnerHTML={{
        __html: `
          class HILOGame {
            constructor() {
              this.balance = 1000;
              this.serverSeed = this.generateServerSeed();
              this.clientSeed = null;
              this.nonce = 0;
              this.gameHistory = [];
              this.isRolling = false;
              
              this.initializeEventListeners();
              this.updateDisplay();
            }

            generateServerSeed() {
              const array = new Uint8Array(32);
              crypto.getRandomValues(array);
              return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
            }

            generateClientSeed() {
              const array = new Uint8Array(16);
              crypto.getRandomValues(array);
              return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
            }

            async sha256(message) {
              const msgBuffer = new TextEncoder().encode(message);
              const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }

            async rollDice() {
              if (!this.clientSeed) {
                this.clientSeed = this.generateClientSeed();
              }

              const message = \`\${this.serverSeed}:\${this.clientSeed}:\${this.nonce}\`;
              const hash = await this.sha256(message);
              
              const hexValue = hash.substring(0, 8);
              const decimalValue = parseInt(hexValue, 16);
              const diceResult = (decimalValue % 6) + 1;
              
              this.nonce++;
              return { diceResult, hash, message };
            }

            initializeEventListeners() {
              const betLowBtn = document.getElementById('betLow');
              const betHighBtn = document.getElementById('betHigh');
              const clientSeedEl = document.getElementById('clientSeed');
              
              if (betLowBtn) betLowBtn.addEventListener('click', () => this.placeBet('low'));
              if (betHighBtn) betHighBtn.addEventListener('click', () => this.placeBet('high'));
              if (clientSeedEl) clientSeedEl.addEventListener('click', () => this.generateNewClientSeed());
            }

            generateNewClientSeed() {
              this.clientSeed = this.generateClientSeed();
              this.nonce = 0;
              this.updateDisplay();
            }

            async placeBet(side) {
              if (this.isRolling) return;

              const betAmount = parseInt(document.getElementById('betAmount').value);
              if (betAmount < 1 || betAmount > this.balance) {
                alert('Invalid bet amount!');
                return;
              }

              this.isRolling = true;
              this.disableButtons(true);

              const diceContainer = document.getElementById('diceContainer');
              const diceEl = document.getElementById('dice');
              const resultEl = document.getElementById('result');

              if (diceContainer) diceContainer.style.display = 'block';
              if (diceEl) diceEl.textContent = '⚀';
              if (resultEl) resultEl.textContent = '';

              const rollInterval = setInterval(() => {
                if (diceEl) {
                  const randomDice = Math.floor(Math.random() * 6) + 1;
                  diceEl.textContent = this.getDiceEmoji(randomDice);
                }
              }, 100);

              setTimeout(async () => {
                clearInterval(rollInterval);
                const { diceResult, hash, message } = await this.rollDice();
                
                if (diceEl) diceEl.textContent = this.getDiceEmoji(diceResult);
                
                const isHigh = diceResult >= 4;
                const playerWon = (side === 'low' && !isHigh) || (side === 'high' && isHigh);
                
                this.balance += playerWon ? betAmount : -betAmount;
                
                const resultText = \`Rolled \${diceResult} - \${isHigh ? 'HIGH' : 'LOW'} - \${playerWon ? 'YOU WIN!' : 'HOUSE WINS!'}\`;
                if (resultEl) {
                  resultEl.textContent = resultText;
                  resultEl.className = \`result \${playerWon ? 'win' : 'lose'}\`;
                }
                
                const serverSeedEl = document.getElementById('serverSeed');
                const clientSeedEl = document.getElementById('clientSeed');
                const nonceEl = document.getElementById('nonce');
                const resultHashEl = document.getElementById('resultHash');
                
                if (serverSeedEl) serverSeedEl.textContent = this.serverSeed;
                if (clientSeedEl) clientSeedEl.textContent = this.clientSeed;
                if (nonceEl) nonceEl.textContent = this.nonce - 1;
                if (resultHashEl) resultHashEl.textContent = hash;
                
                this.gameHistory.unshift({
                  diceResult,
                  side,
                  betAmount,
                  won: playerWon,
                  timestamp: new Date(),
                  hash,
                  message
                });
                
                this.updateDisplay();
                this.isRolling = false;
                this.disableButtons(false);
              }, 2000);
            }

            getDiceEmoji(number) {
              const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
              return diceEmojis[number - 1];
            }

            disableButtons(disabled) {
              const betLowBtn = document.getElementById('betLow');
              const betHighBtn = document.getElementById('betHigh');
              const betAmountInput = document.getElementById('betAmount');
              
              if (betLowBtn) betLowBtn.disabled = disabled;
              if (betHighBtn) betHighBtn.disabled = disabled;
              if (betAmountInput) betAmountInput.disabled = disabled;
            }

            updateDisplay() {
              const balanceEl = document.getElementById('balance');
              const serverSeedEl = document.getElementById('serverSeed');
              const clientSeedEl = document.getElementById('clientSeed');
              const nonceEl = document.getElementById('nonce');
              
              if (balanceEl) balanceEl.textContent = this.balance;
              if (serverSeedEl) serverSeedEl.textContent = this.serverSeed;
              if (clientSeedEl) clientSeedEl.textContent = this.clientSeed || 'Click to generate';
              if (nonceEl) nonceEl.textContent = this.nonce;
              
              this.updateHistory();
            }

            updateHistory() {
              const historyList = document.getElementById('historyList');
              if (!historyList) return;
              
              historyList.innerHTML = '';
              
              this.gameHistory.slice(0, 10).forEach(game => {
                const historyItem = document.createElement('div');
                historyItem.className = \`history-item \${game.won ? 'win' : 'lose'}\`;
                historyItem.innerHTML = \`
                  <div>
                    <strong>\${this.getDiceEmoji(game.diceResult)}</strong> 
                    <span>\${game.side.toUpperCase()} - $\${game.betAmount}</span>
                  </div>
                  <div>
                    \${game.won ? 'WIN' : 'LOSE'} - \${game.timestamp.toLocaleTimeString()}
                  </div>
                \`;
                historyList.appendChild(historyItem);
              });
            }

            clearHistory() {
              this.gameHistory = [];
              this.updateHistory();
            }
          }

          window.verifyResult = function() {
            if (!game || game.gameHistory.length === 0) {
              alert('No games to verify yet!');
              return;
            }

            const lastGame = game.gameHistory[0];
            const message = \`\${game.serverSeed}:\${game.clientSeed}:\${game.nonce - 1}\`;
            
            game.sha256(message).then(hash => {
              const isValid = hash === lastGame.hash;
              alert(\`Verification \${isValid ? 'PASSED' : 'FAILED'}!\\n\\nExpected: \${lastGame.hash}\\nCalculated: \${hash}\`);
            });
          }

          window.clearHistory = function() {
            if (game) game.clearHistory();
          }

          let game;
          document.addEventListener('DOMContentLoaded', () => {
            game = new HILOGame();
          });
        `
      }} />
    </>
  )
}

// Landing Page Component
function LandingPage({ setCurrentPage }) {
  return (
    <div className="landing-page">
      <div className="hero-section">
        <h1>Welcome to HILO</h1>
        <p className="hero-subtitle">Premium Gaming Experience</p>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">$2.5M+</span>
            <span className="stat-label">Won Today</span>
          </div>
          <div className="stat">
            <span className="stat-number">15K+</span>
            <span className="stat-label">Active Players</span>
          </div>
          <div className="stat">
            <span className="stat-number">99.9%</span>
            <span className="stat-label">Uptime</span>
          </div>
        </div>
      </div>

      <div className="featured-games">
        <h2>Featured Games</h2>
        <div className="games-grid">
          <div className="game-card featured" onClick={() => setCurrentPage('dice')}>
            <div className="game-icon">🎲</div>
            <div className="game-info">
              <h3>Premium Dice</h3>
              <p>Classic dice game with provably fair mechanics</p>
              <div className="game-stats">
                <span className="stat">99.5% RTP</span>
                <span className="stat">High Volatility</span>
              </div>
            </div>
            <div className="play-button">Play Now</div>
          </div>

          <div className="game-card">
            <div className="game-icon">🎰</div>
            <div className="game-info">
              <h3>Mega Slots</h3>
              <p>Spin to win with massive jackpots</p>
              <div className="game-stats">
                <span className="stat">96.2% RTP</span>
                <span className="stat">Medium Volatility</span>
              </div>
            </div>
            <div className="play-button">Coming Soon</div>
          </div>

          <div className="game-card">
            <div className="game-icon">🃏</div>
            <div className="game-info">
              <h3>Blackjack Pro</h3>
              <p>Beat the dealer in this classic card game</p>
              <div className="game-stats">
                <span className="stat">99.3% RTP</span>
                <span className="stat">Low Volatility</span>
              </div>
            </div>
            <div className="play-button">Coming Soon</div>
          </div>

          <div className="game-card">
            <div className="game-icon">🎯</div>
            <div className="game-info">
              <h3>Lightning Roulette</h3>
              <p>Fast-paced roulette with multipliers</p>
              <div className="game-stats">
                <span className="stat">97.3% RTP</span>
                <span className="stat">High Volatility</span>
              </div>
            </div>
            <div className="play-button">Coming Soon</div>
          </div>
        </div>
      </div>

      <div className="promotions">
        <h2>Current Promotions</h2>
        <div className="promo-grid">
          <div className="promo-card">
            <div className="promo-header">
              <span className="promo-badge">HOT</span>
              <h3>Welcome Bonus</h3>
            </div>
            <p>Get 100% bonus up to $500 on your first deposit</p>
            <div className="promo-cta">Claim Now</div>
          </div>

          <div className="promo-card">
            <div className="promo-header">
              <span className="promo-badge">NEW</span>
              <h3>Daily Challenge</h3>
            </div>
            <p>Complete daily challenges for bonus rewards</p>
            <div className="promo-cta">View Challenges</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .landing-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-section {
          text-align: center;
          padding: 60px 0;
          margin-bottom: 80px;
        }

        .hero-section h1 {
          font-size: 4rem;
          font-weight: 700;
          background: linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
        }

        .hero-subtitle {
          font-size: 1.3rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 40px;
        }

        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 60px;
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: #d4af37;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .featured-games {
          margin-bottom: 80px;
        }

        .featured-games h2 {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 32px;
          text-align: center;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .game-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .game-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border-color: rgba(212, 175, 55, 0.3);
        }

        .game-card.featured {
          border-color: rgba(212, 175, 55, 0.5);
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%);
        }

        .game-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
        }

        .game-info h3 {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .game-info p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 16px;
          font-size: 0.9rem;
        }

        .game-stats {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .game-stats .stat {
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .play-button {
          background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%);
          color: #000;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .play-button:hover {
          background: linear-gradient(135deg, #ffd700 0%, #d4af37 100%);
          transform: scale(1.05);
        }

        .promotions {
          margin-bottom: 40px;
        }

        .promotions h2 {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 32px;
          text-align: center;
        }

        .promo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .promo-card {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .promo-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .promo-badge {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .promo-header h3 {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .promo-card p {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 16px;
        }

        .promo-cta {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .promo-cta:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .hero-section h1 {
            font-size: 2.5rem;
          }

          .hero-stats {
            flex-direction: column;
            gap: 20px;
          }

          .games-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

// Dice Game Component
function DiceGame() {
  return (
    <div className="dice-game">
      <div className="game-header">
        <h2>Premium Dice</h2>
        <p>Classic dice game with provably fair mechanics</p>
      </div>

      <div className="game-rules">
        <h3>Game Rules</h3>
        <div className="rules-grid">
          <div className="rule-item">
            <div className="rule-number">1</div>
            <span>Roll a 6-sided dice</span>
          </div>
          <div className="rule-item">
            <div className="rule-number">2</div>
            <span><strong>HIGH (4-6):</strong> House wins</span>
          </div>
          <div className="rule-item">
            <div className="rule-number">3</div>
            <span><strong>LOW (1-3):</strong> Player wins</span>
          </div>
        </div>
      </div>

      <div className="bet-section">
        <div className="bet-input-container">
          <label htmlFor="betAmount">Bet Amount</label>
          <input 
            type="number" 
            id="betAmount" 
            min="1" 
            max="1000" 
            defaultValue="10"
            className="bet-input"
          />
        </div>
        
        <div className="bet-buttons">
          <button className="bet-btn bet-low" id="betLow">
            <span className="btn-text">BET LOW</span>
            <span className="btn-subtext">1-3</span>
          </button>
          <button className="bet-btn bet-high" id="betHigh">
            <span className="btn-text">BET HIGH</span>
            <span className="btn-subtext">4-6</span>
          </button>
        </div>
      </div>

      <div className="dice-container" id="diceContainer" style={{display: 'none'}}>
        <div className="dice-rolling">
          <h3>Rolling...</h3>
          <div className="dice" id="dice">⚀</div>
          <div className="result" id="result"></div>
        </div>
      </div>

      <div className="provably-fair">
        <div className="pf-header">
          <h3>🛡️ Provably Fair</h3>
          <span className="pf-badge">Verified</span>
        </div>
        <div className="pf-content">
          <div className="pf-item">
            <label>Server Seed</label>
            <div className="hash-display" id="serverSeed">Generating...</div>
          </div>
          <div className="pf-item">
            <label>Client Seed</label>
            <div className="hash-display" id="clientSeed">Click to generate</div>
          </div>
          <div className="pf-item">
            <label>Nonce</label>
            <span id="nonce">0</span>
          </div>
          <div className="pf-item">
            <label>Result Hash</label>
            <div className="hash-display" id="resultHash">-</div>
          </div>
          <button className="verify-btn" onClick={() => window.verifyResult()}>Verify Result</button>
        </div>
      </div>

      <div className="history">
        <div className="history-header">
          <h3>Game History</h3>
          <button className="clear-history" onClick={() => window.clearHistory()}>Clear</button>
        </div>
        <div id="historyList" className="history-list"></div>
      </div>

      <style jsx>{`
        .dice-game {
          max-width: 800px;
          margin: 0 auto;
        }

        .game-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .game-header h2 {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .game-header p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
        }

        .game-rules {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .game-rules h3 {
          color: #ffffff;
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 20px;
          text-align: center;
        }

        .rules-grid {
          display: grid;
          gap: 16px;
        }

        .rule-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .rule-number {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .rule-item span {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.95rem;
        }

        .bet-section {
          margin-bottom: 32px;
        }

        .bet-input-container {
          margin-bottom: 24px;
        }

        .bet-input-container label {
          display: block;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .bet-input {
          width: 100%;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 500;
          text-align: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .bet-input:focus {
          outline: none;
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }

        .bet-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .bet-btn {
          padding: 20px 24px;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .bet-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .bet-btn:hover::before {
          left: 100%;
        }

        .bet-low {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%);
          border-color: rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        .bet-low:hover {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(34, 197, 94, 0.2);
        }

        .bet-high {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .bet-high:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(239, 68, 68, 0.2);
        }

        .bet-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .btn-text {
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .btn-subtext {
          font-size: 0.85rem;
          opacity: 0.8;
          font-weight: 400;
        }

        .dice-container {
          margin: 32px 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          backdrop-filter: blur(20px);
        }

        .dice-rolling h3 {
          color: #d4af37;
          font-size: 1.3rem;
          margin-bottom: 24px;
          font-weight: 500;
        }

        .dice {
          font-size: 5rem;
          margin: 24px 0;
          animation: diceRoll 1.5s ease-in-out;
          filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.5));
        }

        @keyframes diceRoll {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.1); }
          50% { transform: rotate(180deg) scale(1.2); }
          75% { transform: rotate(270deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }

        .result {
          font-size: 1.4rem;
          font-weight: 600;
          margin: 24px 0;
          padding: 20px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .result.win {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%);
          border-color: rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        .result.lose {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .provably-fair {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .pf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .pf-header h3 {
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pf-badge {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .pf-content {
          display: grid;
          gap: 16px;
        }

        .pf-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pf-item label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          font-weight: 500;
        }

        .hash-display {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
          word-break: break-all;
          line-height: 1.4;
        }

        .verify-btn {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: 8px;
          transition: all 0.3s ease;
        }

        .verify-btn:hover {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
        }

        .history {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .history-header h3 {
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .clear-history {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .clear-history:hover {
          background: rgba(239, 68, 68, 0.3);
          transform: translateY(-1px);
        }

        .history-list {
          display: grid;
          gap: 12px;
        }

        .history-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .history-item:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }

        .history-item.win {
          border-left: 4px solid #22c55e;
        }

        .history-item.lose {
          border-left: 4px solid #ef4444;
        }

        .history-item div:first-child {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .history-item strong {
          font-size: 1.2rem;
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
        }

        .history-item div:last-child {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          text-align: right;
        }

        @media (max-width: 768px) {
          .game-header h2 {
            font-size: 2rem;
          }
          
          .bet-buttons {
            grid-template-columns: 1fr;
          }
          
          .dice {
            font-size: 4rem;
          }
        }
      `}</style>
    </div>
  )
}
