import React from 'react'
import { Link } from 'react-router-dom'

const Section: React.FC<{ id: string; title: string }> = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-24">
    <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
      <span className="w-1.5 h-5 bg-hilo-gold inline-block rounded-sm" />
      {title}
    </h2>
    <div className="bg-hilo-black/50 border border-hilo-gray-light rounded-xl p-5 text-gray-300">
      {children}
    </div>
  </section>
)

export const FAQPage: React.FC = () => {
  const items = [
    { id: 'wallets', label: 'Wallets & Accounts' },
    { id: 'deposits', label: 'Deposits' },
    { id: 'withdrawals', label: 'Withdrawals' },
    { id: 'provably-fair', label: 'Provably Fair' },
    { id: 'bonuses', label: 'Bonuses & Promotions' },
    { id: 'limits', label: 'Limits & Fees' },
    { id: 'security', label: 'Security & Safety' },
    { id: 'compliance', label: 'Compliance & Eligibility' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
    { id: 'support', label: 'Support' },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="text-gray-400 mt-2">Everything you need to know about using our Solana crypto casino.</p>
      </div>

      {/* Table of contents */}
      <div className="mb-8 bg-hilo-gray border border-hilo-gray-light rounded-xl p-4">
        <div className="grid sm:grid-cols-2 gap-2">
          {items.map(i => (
            <a key={i.id} href={`#${i.id}`} className="text-sm text-gray-300 hover:text-hilo-gold transition-colors">
              {i.label}
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <Section id="wallets" title="Wallets & Accounts">
          <ul className="list-disc pl-5 space-y-2">
            <li>We are non-custodial — you connect a Solana wallet (e.g., Phantom, Solflare) instead of creating a traditional account.</li>
            <li>Your wallet address is your identity. Keep your seed phrase private; we can never recover it.</li>
            <li>You can disconnect your wallet at any time from the header wallet menu.</li>
          </ul>
        </Section>

        <Section id="deposits" title="Deposits">
          <ul className="list-disc pl-5 space-y-2">
            <li>Supported currencies: SOL and selected SPL tokens (e.g., USDC) as displayed in the UI.</li>
            <li>Deposits are on-chain. After sending, confirmations are usually near-instant; occasionally it may take a minute.</li>
            <li>Only send assets on Solana mainnet to the deposit addresses we provide. Other networks may result in permanent loss.</li>
          </ul>
        </Section>

        <Section id="withdrawals" title="Withdrawals">
          <ul className="list-disc pl-5 space-y-2">
            <li>Withdrawals are processed on-chain to the connected wallet unless you specify another valid address.</li>
            <li>Network fees are paid in SOL; ensure your wallet has enough SOL for fees.</li>
            <li>Large or unusual withdrawals may require additional verification to protect users and the platform.</li>
          </ul>
        </Section>

        <Section id="provably-fair" title="Provably Fair">
          <p className="mb-3">Every game outcome is generated using our provably fair system. Each round uses:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>A server seed (committed via hash) and a client seed (from your browser), combined with a nonce.</li>
            <li>You can verify any result via the <Link to="/provably-fair" className="text-hilo-gold hover:underline">Provably Fair</Link> page.</li>
            <li>Seeds rotate regularly; you can set a custom client seed for independent verification.</li>
          </ul>
        </Section>

        <Section id="bonuses" title="Bonuses & Promotions">
          <ul className="list-disc pl-5 space-y-2">
            <li>Daily Wheel and seasonal promotions credit rewards directly to your in-site balance.</li>
            <li>Some bonuses include wagering requirements. Details are shown in the promotion terms.</li>
            <li>Abuse or multi-accounting may void bonuses and winnings as outlined in our anti-abuse policy.</li>
          </ul>
        </Section>

        <Section id="limits" title="Limits & Fees">
          <ul className="list-disc pl-5 space-y-2">
            <li>Minimum bet and maximum payout vary by game and are shown in the game UI.</li>
            <li>Deposits and withdrawals are subject to standard Solana network fees; we do not add hidden fees.</li>
            <li>Responsible limits are available in <Link to="/wallet" className="text-hilo-gold hover:underline">Wallet</Link> and <Link to="/settings" className="text-hilo-gold hover:underline">Settings</Link> areas where applicable.</li>
          </ul>
        </Section>

        <Section id="security" title="Security & Safety">
          <ul className="list-disc pl-5 space-y-2">
            <li>We never ask for your seed phrase or private keys. Only sign transactions you understand.</li>
            <li>Smart contracts and backend services are monitored; see <Link to="/provably-fair" className="text-hilo-gold hover:underline">Provably Fair</Link> for verification tools.</li>
            <li>Enable security features in your wallet (e.g., transaction simulation, trusted app domains).</li>
          </ul>
        </Section>

        <Section id="compliance" title="Compliance & Eligibility">
          <ul className="list-disc pl-5 space-y-2">
            <li>You must be of legal gambling age in your jurisdiction and accept our Terms.</li>
            <li>Some regions may be restricted from real-money play due to local regulations.</li>
            <li>We support fair play; anti-abuse and AML checks may apply to suspicious activity.</li>
          </ul>
        </Section>

        <Section id="troubleshooting" title="Troubleshooting">
          <ul className="list-disc pl-5 space-y-2">
            <li>If a wallet action is stuck, try reconnecting your wallet and ensuring you have SOL for fees.</li>
            <li>Clear site storage/cache and reload if UI appears out of sync.</li>
            <li>For missing transactions, check a Solana explorer (e.g., Solscan) using your wallet address.</li>
          </ul>
        </Section>

        <Section id="support" title="Support">
          <p className="text-gray-300">Still need help? Contact <a className="text-hilo-gold hover:underline" href="mailto:support@hilocasino.com?subject=Support Request">support@hilocasino.com</a>.</p>
        </Section>
      </div>
    </div>
  )
}

export default FAQPage


