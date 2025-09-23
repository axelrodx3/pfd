import React, { useRef, useState } from 'react'
import Modal from './Modal'
import DailyWheel, { DailyWheelHandle } from './DailyWheel'
import { mockAPI } from '../lib/api'

interface DailyWheelModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DailyWheelModal: React.FC<DailyWheelModalProps> = ({ isOpen, onClose }) => {
  const [wheelSpinning, setWheelSpinning] = useState(false)
  const [wheelResult, setWheelResult] = useState<number | null>(null)
  const wheelRef = useRef<DailyWheelHandle | null>(null)

  const handleDailyWheel = async () => {
    setWheelSpinning(true)
    setWheelResult(null)
    try {
      const result = await mockAPI.spinDailyWheel()
      setWheelResult(result.reward)
      const rewards = [50, 100, 250, 500, 1000, 2000]
      const index = rewards.indexOf(result.reward)
      const landingIndex = index >= 0 ? index : Math.floor(Math.random() * rewards.length)
      wheelRef.current?.spinToIndex(landingIndex)
    } catch (e) {
      console.error('Failed to spin wheel:', e)
    } finally {
      setWheelSpinning(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Daily Wheel">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <DailyWheel
            ref={wheelRef as any}
            size={300}
            segments={[
              { label: '50', value: 50, color: '#F59E0B' },
              { label: '100', value: 100, color: '#10B981' },
              { label: '250', value: 250, color: '#3B82F6' },
              { label: '500', value: 500, color: '#A855F7' },
              { label: '1000', value: 1000, color: '#EF4444' },
              { label: '2000', value: 2000, color: '#EAB308' },
            ]}
          />
        </div>

        {wheelResult && (
          <div className="mb-4 p-4 bg-hilo-green/20 border border-emerald-500/30 rounded-lg">
            <div className="text-2xl font-bold text-white">You won {wheelResult} HILO tokens!</div>
          </div>
        )}

        <button
          onClick={handleDailyWheel}
          disabled={wheelSpinning}
          className="w-full py-3 bg-hilo-gold text-black font-bold rounded-lg hover:bg-hilo-gold/80 transition-colors disabled:opacity-50"
        >
          {wheelSpinning ? 'Spinning...' : 'Spin Wheel'}
        </button>

        {/* Informational blocks */}
        <div className="mt-6 grid gap-3 text-left">
          <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
            <div className="text-sm text-blue-300">
              Streak Bonus: +10% after 3 consecutive daily spins
            </div>
          </div>
          <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/30">
            <div className="text-sm text-purple-300">
              Next Free Spin Countdown: 23h 59m (placeholder)
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/30">
            <div className="text-sm text-amber-300">
              Recent Rewards: 250 • 50 • 1000 • 100 (placeholder)
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default DailyWheelModal


