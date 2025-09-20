import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>HILO - Premium Casino Experience</title>
        <meta name="description" content="HILO - Experience premium dice gaming with elegant design and provably fair mechanics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="app-container">
        <div className="game-container">
          {/* Header */}
          <div className="header">
            <div className="logo">
              <div className="logo-icon">🎯</div>
              <h1>HILO</h1>
            </div>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-label">Online</span>
                <span className="stat-value">1,247</span>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className="balance-card">
            <div className="balance-main">
              <div className="balance-icon">💎</div>
              <div className="balance-info">
                <span className="balance-label">Your Balance</span>
                <span className="balance-amount">$<span id="balance">1000</span></span>
              </div>
            </div>
            <div className="balance-actions">
              <button className="action-btn deposit">+ Deposit</button>
              <button className="action-btn withdraw">- Withdraw</button>
            </div>
          </div>

          {/* Game Area */}
          <div className="game-area">
            <div className="game-header">
              <h2>Dice Game</h2>
              <div className="game-stats">
                <span className="stat">House Edge: 2.5%</span>
                <span className="stat">Max Win: $10,000</span>
              </div>
            </div>

            {/* Betting Section */}
            <div className="betting-section">
              <div className="bet-amount">
                <label>Bet Amount</label>
                <div className="input-group">
                  <span className="currency">$</span>
                  <input 
                    type="number" 
                    id="betAmount" 
                    min="1" 
                    max="1000" 
                    defaultValue="10"
                    className="bet-input"
                  />
                </div>
                <div className="quick-bets">
                  <button className="quick-bet" onClick={() => document.getElementById('betAmount').value = '10'}>$10</button>
                  <button className="quick-bet" onClick={() => document.getElementById('betAmount').value = '50'}>$50</button>
                  <button className="quick-bet" onClick={() => document.getElementById('betAmount').value = '100'}>$100</button>
                  <button className="quick-bet" onClick={() => document.getElementById('betAmount').value = '500'}>$500</button>
                </div>
              </div>

              <div className="bet-options">
                <button className="bet-option bet-low" id="betLow">
                  <div className="bet-icon">📉</div>
                  <div className="bet-info">
                    <span className="bet-title">LOW</span>
                    <span className="bet-subtitle">1 - 3</span>
                    <span className="bet-payout">Payout: 2x</span>
                  </div>
                </button>
                
                <button className="bet-option bet-high" id="betHigh">
                  <div className="bet-icon">📈</div>
                  <div className="bet-info">
                    <span className="bet-title">HIGH</span>
                    <span className="bet-subtitle">4 - 6</span>
                    <span className="bet-payout">Payout: 2x</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Dice Display */}
            <div className="dice-display" id="diceContainer" style={{display: 'none'}}>
              <div className="dice-animation">
                <div className="dice" id="dice">⚀</div>
                <div className="dice-shadow"></div>
              </div>
              <div className="result-display" id="result"></div>
            </div>
          </div>

          {/* Provably Fair Section */}
          <div className="provably-fair">
            <div className="pf-header">
              <h3>🔒 Provably Fair</h3>
              <div className="pf-status">
                <span className="status-dot"></span>
                <span>Verified</span>
              </div>
            </div>
            <div className="pf-content">
              <div className="pf-grid">
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
                  <span id="nonce" className="nonce-value">0</span>
                </div>
                <div className="pf-item">
                  <label>Result Hash</label>
                  <div className="hash-display" id="resultHash">-</div>
                </div>
              </div>
              <button className="verify-btn" onClick={() => window.verifyResult()}>
                <span>🔍</span> Verify Result
              </button>
            </div>
          </div>

          {/* Game History */}
          <div className="history-section">
            <div className="history-header">
              <h3>Recent Games</h3>
              <button className="clear-btn" onClick={() => window.clearHistory()}>Clear All</button>
            </div>
            <div id="historyList" className="history-list"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
          min-height: 100vh;
          color: #ffffff;
          overflow-x: hidden;
        }

        .app-container {
          min-height: 100vh;
          padding: 20px;
          position: relative;
        }

        .app-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%);
          pointer-events: none;
          z-index: -1;
        }

        .game-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          gap: 24px;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(20px);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          font-size: 2rem;
          filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5));
        }

        .logo h1 {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .header-stats {
          display: flex;
          gap: 24px;
        }

        .stat-item {
          text-align: right;
        }

        .stat-label {
          display: block;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          color: #22c55e;
          font-size: 1.2rem;
          font-weight: 700;
        }

        /* Balance Card */
        .balance-card {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 20px;
          padding: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .balance-main {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .balance-icon {
          font-size: 3rem;
          filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.5));
        }

        .balance-info {
          display: flex;
          flex-direction: column;
        }

        .balance-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .balance-amount {
          color: #d4af37;
          font-size: 2.5rem;
          font-weight: 800;
          text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
        }

        .balance-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          padding: 12px 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .action-btn.deposit {
          border-color: rgba(34, 197, 94, 0.5);
          color: #22c55e;
        }

        .action-btn.withdraw {
          border-color: rgba(239, 68, 68, 0.5);
          color: #ef4444;
        }

        /* Game Area */
        .game-area {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(20px);
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .game-header h2 {
          font-size: 1.8rem;
          font-weight: 700;
          color: #ffffff;
        }

        .game-stats {
          display: flex;
          gap: 24px;
        }

        .stat {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Betting Section */
        .betting-section {
          display: grid;
          gap: 32px;
        }

        .bet-amount {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .bet-amount label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
          font-weight: 600;
        }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .currency {
          position: absolute;
          left: 20px;
          color: #d4af37;
          font-weight: 700;
          font-size: 1.2rem;
          z-index: 2;
        }

        .bet-input {
          width: 100%;
          padding: 20px 20px 20px 50px;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: #ffffff;
          font-size: 1.2rem;
          font-weight: 600;
          text-align: center;
          transition: all 0.3s ease;
        }

        .bet-input:focus {
          outline: none;
          border-color: #d4af37;
          box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
        }

        .quick-bets {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .quick-bet {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .quick-bet:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        /* Bet Options */
        .bet-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .bet-option {
          padding: 32px 24px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }

        .bet-option::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .bet-option:hover::before {
          left: 100%;
        }

        .bet-option:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .bet-low {
          border-color: rgba(34, 197, 94, 0.3);
        }

        .bet-low:hover {
          border-color: rgba(34, 197, 94, 0.6);
          box-shadow: 0 20px 40px rgba(34, 197, 94, 0.2);
        }

        .bet-high {
          border-color: rgba(239, 68, 68, 0.3);
        }

        .bet-high:hover {
          border-color: rgba(239, 68, 68, 0.6);
          box-shadow: 0 20px 40px rgba(239, 68, 68, 0.2);
        }

        .bet-icon {
          font-size: 2.5rem;
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
        }

        .bet-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .bet-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #ffffff;
        }

        .bet-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .bet-payout {
          font-size: 0.9rem;
          color: #d4af37;
          font-weight: 600;
        }

        .bet-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Dice Display */
        .dice-display {
          text-align: center;
          padding: 40px;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          margin-top: 32px;
        }

        .dice-animation {
          position: relative;
          margin-bottom: 32px;
        }

        .dice {
          font-size: 6rem;
          margin: 0 auto;
          animation: diceRoll 2s ease-in-out;
          filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.5));
          position: relative;
          z-index: 2;
        }

        .dice-shadow {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 20px;
          background: radial-gradient(ellipse, rgba(0, 0, 0, 0.5), transparent);
          border-radius: 50%;
          z-index: 1;
        }

        @keyframes diceRoll {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.1); }
          50% { transform: rotate(180deg) scale(1.2); }
          75% { transform: rotate(270deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }

        .result-display {
          font-size: 1.5rem;
          font-weight: 700;
          padding: 20px 32px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: inline-block;
        }

        .result-display.win {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%);
          border-color: rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        .result-display.lose {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        /* Provably Fair */
        .provably-fair {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(20px);
        }

        .pf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .pf-header h3 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pf-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #22c55e;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .pf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .pf-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pf-item label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .hash-display {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
          word-break: break-all;
          line-height: 1.4;
          min-height: 60px;
        }

        .nonce-value {
          background: rgba(212, 175, 55, 0.2);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          padding: 16px;
          color: #d4af37;
          font-size: 1.2rem;
          font-weight: 700;
          text-align: center;
        }

        .verify-btn {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          margin: 0 auto;
        }

        .verify-btn:hover {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(34, 197, 94, 0.3);
        }

        /* History */
        .history-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(20px);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .history-header h3 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #ffffff;
        }

        .clear-btn {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 8px 16px;
          border-radius: 8px;
          color: #ef4444;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .clear-btn:hover {
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
          padding: 16px 20px;
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
          font-size: 1.4rem;
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
        }

        .history-item div:last-child {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          text-align: right;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .game-container {
            gap: 16px;
          }
          
          .header {
            padding: 16px 20px;
          }
          
          .logo h1 {
            font-size: 2rem;
          }
          
          .balance-card {
            padding: 20px;
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
          
          .game-area {
            padding: 20px;
          }
          
          .bet-options {
            grid-template-columns: 1fr;
          }
          
          .pf-grid {
            grid-template-columns: 1fr;
          }
          
          .dice {
            font-size: 4rem;
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
              document.getElementById('betLow').addEventListener('click', () => this.placeBet('low'));
              document.getElementById('betHigh').addEventListener('click', () => this.placeBet('high'));
              document.getElementById('clientSeed').addEventListener('click', () => this.generateNewClientSeed());
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

              document.getElementById('diceContainer').style.display = 'block';
              document.getElementById('dice').textContent = '⚀';
              document.getElementById('result').textContent = '';

              const diceElement = document.getElementById('dice');
              const rollInterval = setInterval(() => {
                const randomDice = Math.floor(Math.random() * 6) + 1;
                diceElement.textContent = this.getDiceEmoji(randomDice);
              }, 100);

              setTimeout(async () => {
                clearInterval(rollInterval);
                const { diceResult, hash, message } = await this.rollDice();
                
                diceElement.textContent = this.getDiceEmoji(diceResult);
                
                const isHigh = diceResult >= 4;
                const playerWon = (side === 'low' && !isHigh) || (side === 'high' && isHigh);
                
                this.balance += playerWon ? betAmount : -betAmount;
                
                const resultText = \`Rolled \${diceResult} - \${isHigh ? 'HIGH' : 'LOW'} - \${playerWon ? 'YOU WIN!' : 'HOUSE WINS!'}\`;
                document.getElementById('result').textContent = resultText;
                document.getElementById('result').className = \`result-display \${playerWon ? 'win' : 'lose'}\`;
                
                document.getElementById('serverSeed').textContent = this.serverSeed;
                document.getElementById('clientSeed').textContent = this.clientSeed;
                document.getElementById('nonce').textContent = this.nonce - 1;
                document.getElementById('resultHash').textContent = hash;
                
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
              document.getElementById('betLow').disabled = disabled;
              document.getElementById('betHigh').disabled = disabled;
              document.getElementById('betAmount').disabled = disabled;
            }

            updateDisplay() {
              document.getElementById('balance').textContent = this.balance;
              document.getElementById('serverSeed').textContent = this.serverSeed;
              document.getElementById('clientSeed').textContent = this.clientSeed || 'Click to generate';
              document.getElementById('nonce').textContent = this.nonce;
              
              this.updateHistory();
            }

            updateHistory() {
              const historyList = document.getElementById('historyList');
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
            if (game.gameHistory.length === 0) {
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
            game.clearHistory();
          }

          document.addEventListener('DOMContentLoaded', () => {
            game = new HILOGame();
          });
        `
      }} />
    </>
  )
}
