import React, { useEffect, useMemo, useRef, useState } from 'react'
import Modal from './Modal'
import DailyWheel, { DailyWheelHandle } from './DailyWheel'
import { mockAPI } from '../lib/api'
import { useWalletContext } from '../contexts/WalletContextWrapper'
import { useToast } from './Toast'

interface DailyWheelModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DailyWheelModal: React.FC<DailyWheelModalProps> = ({ isOpen, onClose }) => {
  const [wheelSpinning, setWheelSpinning] = useState(false)
  const [wheelResult, setWheelResult] = useState<number | null>(null)
  const [baseReward, setBaseReward] = useState<number | null>(null)
  const [streak, setStreak] = useState<number>(0)
  const [bonusApplied, setBonusApplied] = useState<number>(0)
  const [lastSpinAt, setLastSpinAt] = useState<Date | null>(null)
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0)
  const wheelRef = useRef<DailyWheelHandle | null>(null)
  const { publicKey } = useWalletContext()
  const { success, error } = useToast()
  const [recentRewards, setRecentRewards] = useState<Array<{ id: string; username: string; avatarUrl?: string | null; amount: number; timestamp: string }>>([])
  const [rewardsLoading, setRewardsLoading] = useState<boolean>(false)

  const storageKey = useMemo(() => {
    const pk = publicKey?.toString() || 'guest'
    return `daily_wheel_${pk}`
  }, [publicKey])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        const last = parsed?.lastSpinAt ? new Date(parsed.lastSpinAt) : null
        const count = Number(parsed?.streak || 0)
        if (last) {
          const updatedCount = computeUpdatedStreak(last, new Date(), count, false)
          setStreak(updatedCount)
          setLastSpinAt(last)
        } else {
          setStreak(count)
          setLastSpinAt(null)
        }
      } else {
        setStreak(0)
        setLastSpinAt(null)
      }
    } catch {}
  }, [storageKey, isOpen])

  // Update countdown timer every second when modal is open
  useEffect(() => {
    if (!isOpen) return
    const tick = () => {
      if (!lastSpinAt) {
        setTimeLeftMs(0)
        return
      }
      const unlockAt = lastSpinAt.getTime() + 24 * 60 * 60 * 1000
      const remaining = Math.max(0, unlockAt - Date.now())
      setTimeLeftMs(remaining)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [isOpen, lastSpinAt])

  // Fetch recent rewards with auto-refresh
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const fetchRewards = async () => {
      try {
        setRewardsLoading(true)
        const resp = await fetch('/api/recent-rewards?limit=20', { credentials: 'include' })
        if (!resp.ok) throw new Error('Failed to load recent rewards')
        const data = await resp.json()
        if (!cancelled) setRecentRewards(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setRecentRewards([])
      } finally {
        if (!cancelled) setRewardsLoading(false)
      }
    }
    fetchRewards()
    const id = window.setInterval(fetchRewards, 2 * 60 * 1000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [isOpen])

  function startOfDay(d: Date): Date {
    const dt = new Date(d)
    dt.setHours(0, 0, 0, 0)
    return dt
  }

  function dayDiff(a: Date, b: Date): number {
    const ms = startOfDay(b).getTime() - startOfDay(a).getTime()
    return Math.round(ms / (24 * 60 * 60 * 1000))
  }

  function computeUpdatedStreak(lastSpinAt: Date, now: Date, current: number, incrementForToday: boolean): number {
    const diff = dayDiff(lastSpinAt, now)
    if (diff === 0) {
      // already spun today; only increment if explicitly requested (e.g., first spin of today)
      return incrementForToday ? Math.max(1, current) : current
    }
    if (diff === 1) {
      return current + 1
    }
    // Missed at least one day
    return 1
  }

  const handleDailyWheel = async () => {
    // Enforce 24h cooldown
    const now = new Date()
    if (lastSpinAt) {
      const unlockAt = lastSpinAt.getTime() + 24 * 60 * 60 * 1000
      if (now.getTime() < unlockAt) {
        error('Daily Wheel Locked', `Next free spin in ${formatDuration(unlockAt - now.getTime())}`)
        return
      }
    }

    setWheelSpinning(true)
    setWheelResult(null)
    setBaseReward(null)
    setBonusApplied(0)
    try {
      const result = await mockAPI.spinDailyWheel()
      setBaseReward(result.reward)
      const rewards = [50, 100, 250, 500, 1000, 2000]
      const index = rewards.indexOf(result.reward)
      const landingIndex = index >= 0 ? index : Math.floor(Math.random() * rewards.length)
      wheelRef.current?.spinToIndex(landingIndex)

      // Compute streak and bonus
      const spinTime = now
      let nextStreak = 1
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          const last = parsed?.lastSpinAt ? new Date(parsed.lastSpinAt) : null
          const current = Number(parsed?.streak || 0)
          if (last) {
            nextStreak = computeUpdatedStreak(last, spinTime, current, true)
          } else {
            nextStreak = Math.max(1, current)
          }
        }
        // Persist
        localStorage.setItem(storageKey, JSON.stringify({ lastSpinAt: spinTime.toISOString(), streak: nextStreak }))
      } catch {}
      setStreak(nextStreak)
      setLastSpinAt(spinTime)
      setTimeLeftMs(24 * 60 * 60 * 1000)

      // Apply 10% bonus after 3+ consecutive days
      const bonus = nextStreak >= 3 ? Math.floor(result.reward * 0.10) : 0
      setBonusApplied(bonus)
      setWheelResult(result.reward + bonus)

      if (bonus > 0) {
        success('Streak Bonus Applied', `+${bonus} HILO for ${nextStreak}-day streak`)
      }

      // Report to recent rewards feed (best-effort)
      try {
        const displayName = `Player${(publicKey?.toString() || '').slice(0, 6)}`
        await fetch('/api/recent-rewards/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ amount: result.reward + bonus, username: displayName, avatarUrl: null })
        })
      } catch {}
    } catch (e) {
      console.error('Failed to spin wheel:', e)
      error('Daily Wheel Failed', 'Unable to spin the wheel. Please try again later.')
    } finally {
      setWheelSpinning(false)
    }
  }

  function formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
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

        {/* Streak and result */}
        <div className="grid gap-3 mb-4">
          <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/30 text-purple-200 text-sm">
            Current Streak: <span className="font-semibold text-white">{streak}</span> day{streak === 1 ? '' : 's'}
          </div>
          {wheelResult !== null && (
            <div className="p-4 bg-hilo-green/20 border border-emerald-500/30 rounded-lg">
              <div className="text-2xl font-bold text-white">You won {wheelResult} HILO tokens!</div>
              {bonusApplied > 0 && baseReward !== null && (
                <div className="text-sm text-emerald-300 mt-1">
                  Base {baseReward} + Streak Bonus +{bonusApplied} (10%)
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleDailyWheel}
          disabled={wheelSpinning || (lastSpinAt !== null && timeLeftMs > 0)}
          className="w-full py-3 bg-hilo-gold text-black font-bold rounded-lg hover:bg-hilo-gold/80 transition-colors disabled:opacity-50"
        >
          {wheelSpinning
            ? 'Spinning...'
            : (lastSpinAt !== null && timeLeftMs > 0)
              ? `Available in ${formatDuration(timeLeftMs)}`
              : 'Spin Wheel'}
        </button>

        {/* Informational blocks */}
        <div className="mt-6 grid gap-3 text-left">
          <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
            <div className="text-sm text-blue-300">
              Streak Bonus: +10% after 3 consecutive daily spins
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/30">
            <div className="text-sm text-amber-300 mb-2">Recent Rewards</div>
            {rewardsLoading && (
              <div className="text-amber-200 text-xs">Loading…</div>
            )}
            {!rewardsLoading && recentRewards.length === 0 && (
              <div className="text-amber-200 text-xs">No recent rewards yet.</div>
            )}
            {!rewardsLoading && recentRewards.length > 0 && (
              <div className="relative">
                <div
                  className="flex gap-3 overflow-x-auto pb-1"
                  style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
                >
                  {recentRewards.map(r => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 bg-amber-900/30 border border-amber-500/30 rounded-lg px-3 py-2 min-w-[220px]"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-800 flex items-center justify-center text-xs">
                        {r.avatarUrl ? (
                          <img src={r.avatarUrl} alt={r.username} className="w-full h-full object-cover" />
                        ) : (
                          <span>🎲</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">{r.username}</div>
                        <div className="text-amber-300 text-xs">Won {r.amount} HILO</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default DailyWheelModal


