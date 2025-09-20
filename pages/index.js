import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>HILO - Premium Dice Game</title>
        <meta name="description" content="HILO - A premium dice game experience with elegant design and provably fair mechanics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="app-container">
        <div className="game-container">
          <div className="header">
            <h1>HILO</h1>
            <p className="subtitle">Premium Dice Experience</p>
          </div>
          
          <div className="balance-card">
            <div className="balance-icon">💰</div>
            <div className="balance-info">
              <span className="balance-label">Balance</span>
              <span className="balance-amount">$<span id="balance">1000</span></span>
            </div>
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
              <h3>�� Provably Fair</h3>
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
        </div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%);
          min-height: 100vh;
          color: #ffffff;
        }

        .app-container {
          min-height: 100vh;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .game-container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 48px;
          max-width: 640px;
          width: 100%;
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .game-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }

        .header {
          text-align: center;
          margin-bottom: 48px;
        }

        h1 {
          font-size: 3.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.1rem;
          font-weight: 400;
          letter-spacing: 0.5px;
        }

        .balance-card {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 
            0 8px 32px rgba(212, 175, 55, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .balance-icon {
          font-size: 2rem;
          filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5));
        }

        .balance-info {
          display: flex;
          flex-direction: column;
        }

        .balance-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .balance-amount {
          color: #d4af37;
          font-size: 1.8rem;
          font-weight: 700;
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

        .bet-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
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
          .game-container {
            padding: 24px;
            margin: 10px;
          }
          
          h1 {
            font-size: 2.5rem;
          }
          
          .bet-buttons {
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
                document.getElementById('result').className = \`result \${playerWon ? 'win' : 'lose'}\`;
                
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
