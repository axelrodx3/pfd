import * as React from 'react'
import { communityApi } from '../lib/api'
import { useToast } from '../components/Toast'
import { useWalletContext } from '../contexts/WalletContextWrapper'

type TabKey = 'social' | 'chat' | 'progression' | 'safety'

function SectionContainer({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="border border-gray-800 rounded-lg p-4 bg-black/40">
      <div className="text-xl font-semibold mb-3">{title}</div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

function MockBadge({ label }: { label: string }) {
  return <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-xs">{label}</span>
}

export default function MockCommunityHub() {
  const [activeTab, setActiveTab] = React.useState<TabKey>('social')

  React.useEffect(() => {
    let id: any
    const ping = async () => {
      try { await fetch('/api/community/presence/ping', { method: 'POST', credentials: 'include' }) } catch {}
    }
    ping()
    id = setInterval(ping, 20000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Community Hub</h1>
        <p className="text-gray-400 mt-1">Social graph, chat, progression and safety.</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(
          [
            { key: 'social', label: 'Friends' },
            { key: 'chat', label: 'Chat' },
            { key: 'progression', label: 'Achievements' },
            { key: 'safety', label: 'Safety' }
          ] as Array<{ key: TabKey, label: string }>
        ).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded border text-sm ${activeTab === tab.key ? 'bg-gray-800 border-gray-700' : 'bg-black/30 border-gray-900 hover:border-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'social' && <SocialPresenceSection />}
      {activeTab === 'chat' && <ChatCommsSection />}
      {activeTab === 'progression' && <ProgressionIdentitySection />}
      {activeTab === 'safety' && <SafetyModerationSection />}
    </div>
  )
}

function SocialPresenceSection() {
  const { userProfile } = useWalletContext() as any
  const [query, setQuery] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<Array<{ id: number, username: string, avatarUrl?: string }>>([])
  const [friends, setFriends] = React.useState<any[]>([])
  const [blocks, setBlocks] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const { success, error } = useToast()

  const refreshLists = React.useCallback(async () => {
    try {
      const [f, b] = await Promise.all([
        communityApi.listFriendsWithPresence(),
        communityApi.listBlocks()
      ])
      setFriends(f)
      setBlocks(b)
    } catch (e) {
      // ignore in UI-only error handling for now
    }
  }, [])

  React.useEffect(() => {
    refreshLists()
  }, [refreshLists])

  const onSearch = async () => {
    if (!query.trim()) return setSearchResults([])
    setLoading(true)
    try {
      const res = await communityApi.searchUsers(query.trim())
      let results = res || []

      // Client-side fallback: include own profile if it matches query
      if (userProfile && typeof userProfile.username === 'string') {
        const match = userProfile.username.toLowerCase().includes(query.trim().toLowerCase())
        const already = results.some((r:any) => r.username?.toLowerCase() === userProfile.username.toLowerCase())
        if (match && !already) {
          results = [{ id: userProfile.id || -1, username: userProfile.username, avatarUrl: userProfile.profilePicture }, ...results]
        }
      }

      // Extra fallback: fetch server profile and include if it matches
      if (results.length === 0) {
        try {
          const profRes = await fetch('/api/profile', { credentials: 'include' })
          if (profRes.ok) {
            const prof = await profRes.json()
            if (typeof prof?.username === 'string' && prof.username.toLowerCase().includes(query.trim().toLowerCase())) {
              results = [{ id: prof.id, username: prof.username, avatarUrl: prof.avatarUrl }]
            }
          }
        } catch {}
      }

      setSearchResults(results)
      if (results && results.length > 0) {
        success('Search Successful', `Found ${res.length} user${res.length>1?'s':''}`)
      } else {
        error('No Results', 'No users matched your search')
      }
    } catch (e) {
      setSearchResults([])
      const msg = e instanceof Error ? e.message : 'Unknown error'
      // Fallback: show self if profile username matches query
      try {
        const profRes = await fetch('/api/profile', { credentials: 'include' })
        if (profRes.ok) {
          const prof = await profRes.json()
          if (typeof prof?.username === 'string' && prof.username.toLowerCase().includes(query.trim().toLowerCase())) {
            setSearchResults([{ id: prof.id, username: prof.username, avatarUrl: prof.avatarUrl }])
            success('Search Successful', 'Found your profile')
          } else {
            error('Search Failed', msg)
          }
        } else {
          error('Search Failed', msg)
        }
      } catch {
        error('Search Failed', msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionContainer title="Profiles">
        <div className="flex gap-2 mb-3">
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') onSearch() }} className="flex-1 bg-black/40 border border-gray-900 rounded px-2 py-1 text-sm" placeholder="Search users by username" />
          <button onClick={onSearch} className="px-3 py-1 text-sm border border-gray-800 rounded">{loading?'…':'Search'}</button>
        </div>
        <div className="grid gap-3">
          {searchResults.map(p => (
            <div key={p.id} className="flex items-center justify-between border border-gray-900 rounded p-3 bg-black/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800" />
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{p.username}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={async()=>{ try{ await communityApi.requestFriend(p.id); await refreshLists() }catch{}}} className="px-2 py-1 text-xs border border-gray-800 rounded">Add</button>
                <button onClick={async()=>{ try{ await communityApi.block(p.id); await refreshLists() }catch{}}} className="px-2 py-1 text-xs border border-gray-800 rounded">Block</button>
                <button className="px-2 py-1 text-xs border border-gray-800 rounded">View</button>
              </div>
            </div>
          ))}
          {searchResults.length === 0 && <div className="text-xs text-gray-500">No results yet. Try searching above.</div>}
        </div>
      </SectionContainer>

      <SectionContainer title="Friends">
        <div className="space-y-2">
          <div className="text-sm text-gray-300">Friends</div>
          <div className="flex flex-col gap-2">
            {friends.map(f => (
              <div key={f.id} className="flex items-center justify-between border border-gray-900 rounded p-2 bg-black/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-800" />
                  <div className="text-sm flex items-center gap-2">{f.username} {f.online && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="online"></span>}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={async()=>{ try{ await communityApi.unfriend(f.friend_id); await refreshLists() }catch{}}} className="px-2 py-1 text-xs border border-gray-800 rounded">Unfriend</button>
                </div>
              </div>
            ))}
            {friends.length === 0 && <div className="text-xs text-gray-500">No friends yet.</div>}
          </div>
          <div className="text-sm text-gray-300 mt-4">Pending Requests</div>
          <div className="flex flex-col gap-2">
            {friends.filter((x:any)=>x.status==='pending').map((f:any) => (
              <div key={`p-${f.id}`} className="flex items-center justify-between border border-gray-900 rounded p-2 bg-black/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-800" />
                  <div className="text-sm">{f.username}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={async()=>{ try{ await communityApi.respondFriend(f.id,'accept'); await refreshLists() }catch{}}} className="px-2 py-1 text-xs border border-gray-800 rounded">Accept</button>
                  <button onClick={async()=>{ try{ await communityApi.respondFriend(f.id,'decline'); await refreshLists() }catch{}}} className="px-2 py-1 text-xs border border-gray-800 rounded">Decline</button>
                </div>
              </div>
            ))}
            {friends.filter((x:any)=>x.status==='pending').length===0 && <div className="text-xs text-gray-500">No pending requests.</div>}
          </div>
        </div>
      </SectionContainer>
    </div>
  )
}

function ChatCommsSection() {
  const [channel, setChannel] = React.useState<'global' | 'dm'>('global')
  const [targetUserId, setTargetUserId] = React.useState<number | undefined>(undefined)
  const [messages, setMessages] = React.useState<any[]>([])
  const [input, setInput] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)
  const typingTimeoutRef = React.useRef<any>(null)
  const [localMeta, setLocalMeta] = React.useState<Record<string, { pending?: boolean; failed?: boolean }>>({})
  const [reactions, setReactions] = React.useState<Record<string, Record<string, number>>>({})

  const loadMessages = React.useCallback(async () => {
    try {
      const data = await communityApi.getMessages(channel, targetUserId)
      setMessages(data)
    } catch {}
  }, [channel, targetUserId])

  React.useEffect(() => {
    loadMessages()
    const id = setInterval(loadMessages, 4000)
    return () => clearInterval(id)
  }, [loadMessages])

  const onInputChange = (val: string) => {
    setInput(val)
    if (!isTyping) setIsTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1200)
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text) return
    const tempId = `temp-${Date.now()}`
    const optimistic = { id: tempId, content: text, created_at: new Date().toISOString(), username: 'You' }
    setMessages(prev => [...prev, optimistic])
    setLocalMeta(prev => ({ ...prev, [tempId]: { pending: true } }))
    setInput('')
    try {
      await communityApi.postMessage(channel, text, targetUserId)
      // Refresh and clear pending marker
      await loadMessages()
      setLocalMeta(prev => {
        const next = { ...prev }
        delete next[tempId]
        return next
      })
    } catch (e) {
      setLocalMeta(prev => ({ ...prev, [tempId]: { pending: false, failed: true } }))
    }
  }

  const toggleReaction = (msgId: string | number, emoji: string) => {
    const key = String(msgId)
    setReactions(prev => {
      const current = { ...(prev[key] || {}) }
      const count = current[emoji] || 0
      current[emoji] = count === 1 ? 0 : 1
      const next = { ...prev, [key]: current }
      return next
    })
  }

  return (
    <div className="grid gap-4">
      <SectionContainer title="Channels">
        <div className="flex gap-2 mb-2">
          {(['global','dm'] as const).map(c => (
            <button key={c} onClick={() => setChannel(c)} className={`px-2 py-1 text-xs rounded border ${channel===c?'bg-gray-800 border-gray-700':'bg-black/30 border-gray-900 hover:border-gray-700'}`}>{c.toUpperCase()}</button>
          ))}
          {channel==='dm' && (
            <input type="number" value={targetUserId ?? ''} onChange={e=>setTargetUserId(e.target.value?parseInt(e.target.value):undefined)} className="ml-2 w-32 bg-black/40 border border-gray-900 rounded px-2 py-1 text-xs" placeholder="User ID" />
          )}
        </div>
        <div className="h-56 overflow-auto border border-gray-900 rounded p-3 bg-black/20 space-y-2">
          {messages.map((m:any) => {
            const meta = localMeta[String(m.id)]
            const msgReacts = reactions[String(m.id)] || {}
            return (
              <div key={m.id} className="text-sm group">
                <div>
                  <span className="text-gray-400">[{new Date(m.created_at).toLocaleTimeString()}]</span> <span className="font-medium">{m.username}</span>: {m.content}
                  {meta?.pending && <span className="ml-2 text-xs text-gray-400">(sending…)</span>}
                  {meta?.failed && <button className="ml-2 text-xs text-red-400 underline" onClick={() => {
                    // retry send using current channel/target
                    setLocalMeta(prev => ({ ...prev, [String(m.id)]: { pending: true } }))
                    communityApi.postMessage(channel, m.content, targetUserId)
                      .then(() => { loadMessages(); setLocalMeta(prev => { const n={...prev}; delete n[String(m.id)]; return n }) })
                      .catch(() => setLocalMeta(prev => ({ ...prev, [String(m.id)]: { pending: false, failed: true } })))
                  }}>retry</button>}
                </div>
                <div className="mt-1 ml-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {['👍','🔥','🎲','😂','👏'].map(emo => (
                    <button key={emo} className="px-1 py-0.5 text-xs border border-gray-800 rounded bg-black/30" onClick={() => toggleReaction(m.id, emo)}>{emo}</button>
                  ))}
                  <div className="ml-2 flex items-center gap-2 text-xs text-gray-400">
                    {Object.entries(msgReacts).filter(([,v]) => (v as number)>0).map(([emo, v]) => (
                      <span key={emo}>{emo} {v}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
          {messages.length===0 && <div className="text-xs text-gray-500">No messages.</div>}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={input} onChange={e=>onInputChange(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); sendMessage() } }} className="flex-1 bg-black/40 border border-gray-900 rounded px-2 py-1 text-sm" placeholder={`Message ${channel}`} />
          <button onClick={sendMessage} className="px-3 py-1 text-sm border border-gray-800 rounded">Send</button>
        </div>
        {isTyping && <div className="mt-1 ml-1 text-xs text-gray-500">Typing…</div>}
        <div className="mt-2 flex gap-2">
          {['👍','🔥','🎲','🏆','💬'].map(e => <button key={e} className="px-2 py-1 text-sm border border-gray-800 rounded bg-black/30">{e}</button>)}
        </div>
      </SectionContainer>

      {/* Threads & Watch Parties removed per request; chat takes full width */}
    </div>
  )
}

function ProgressionIdentitySection() {
  const [profile, setProfile] = React.useState<any | null>(null)
  const [progress, setProgress] = React.useState<any | null>(null)
  const { userProfile: walletProfile } = useWalletContext() as any

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' })
        if (res.ok) {
          setProfile(await res.json())
        }
        const prog = await fetch('/api/profile/progression', { credentials: 'include' })
        if (prog.ok) {
          setProgress(await prog.json())
        }
      } catch {}
    })()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionContainer title="Levels & Seasons">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
            {(profile?.avatarUrl || walletProfile?.profilePicture) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(profile?.avatarUrl || walletProfile?.profilePicture) as string} alt={profile?.username || walletProfile?.username || 'User'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-gray-400">
                {(profile?.username || walletProfile?.username || 'U').slice(0,1).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="text-2xl font-semibold">Level {profile?.level ?? '—'}</div>
            <div className="text-sm text-gray-400">{profile?.levelName ?? 'Season'} · XP {profile?.xp ?? 0}</div>
            <div className="w-64 h-2 bg-gray-900 rounded mt-2 overflow-hidden" title={`${(progress?.currentLevelXpRequired||0).toLocaleString()} → ${(progress?.nextLevelXpRequired||0).toLocaleString()}`}>
              <div className="h-2 bg-green-600" style={{ width: `${Math.max(0, Math.min(100, progress?.progressPercent ?? 0))}%` }} />
            </div>
            {progress?.nextLevel && (
              <div className="text-xs text-gray-500 mt-1">Next: Lv {progress.nextLevel} {progress.nextLevelName ? `· ${progress.nextLevelName}` : ''} · XP to target: {Math.max(0, (progress.nextLevelXpRequired||0) - (profile?.xp||0))}</div>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <MockBadge label={`Games: ${profile?.gamesPlayed ?? 0}`} />
          <MockBadge label={`Wagered: ${(profile?.totalWagered ?? 0).toFixed?.(2) ?? profile?.totalWagered ?? 0} SOL`} />
        </div>
      </SectionContainer>

      <SectionContainer title="Achievements & Cosmetics">
        <div className="grid grid-cols-2 gap-3">
          {(profile?.badges ?? []).map((b:any, i:number) => (
            <div key={b.key ?? i} className="border border-gray-900 rounded p-3 bg-black/20">
              <div className="font-medium">{b.name ?? b.key}</div>
              <div className="text-xs text-gray-400">{b.description ?? ''}</div>
              <button className="mt-2 px-2 py-1 text-xs border border-gray-800 rounded">Equip Title</button>
            </div>
          ))}
          {(!profile || (profile?.badges ?? []).length===0) && <div className="text-xs text-gray-500">No achievements yet.</div>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Frame: Neon','Plate: Gold','Table Skin: Carbon','Sound Pack: Retro'].map(c => (
            <MockBadge key={c} label={c} />
          ))}
        </div>
      </SectionContainer>
    </div>
  )
}

function SafetyModerationSection() {
  const [blocked, setBlocked] = React.useState<any[]>([])

  const load = React.useCallback(async ()=>{
    try { setBlocked(await communityApi.listBlocks()) } catch {}
  }, [])

  React.useEffect(()=>{ load() }, [load])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionContainer title="Controls">
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Mute unknown DMs</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Hide win amounts</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Auto-filter toxicity</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Slow mode in global</label>
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-400 mb-1">Blocked Users</div>
          <div className="flex flex-col gap-2">
            {blocked.map(b => (
              <div key={b.user_id} className="flex items-center justify-between border border-gray-900 rounded p-2 bg-black/20">
                <div className="text-sm">{b.username}</div>
                <button onClick={async()=>{ try{ await communityApi.unblock(b.user_id); await load() }catch{}}} className="px-2 py-1 text-xs border border-gray-800 rounded">Unblock</button>
              </div>
            ))}
            {blocked.length===0 && <div className="text-xs text-gray-500">Empty</div>}
          </div>
        </div>
      </SectionContainer>

      <SectionContainer title="Report a User">
        <ReportUserForm />
      </SectionContainer>
    </div>
  )
}

function ReportUserForm() {
  const [userId, setUserId] = React.useState('')
  const [reason, setReason] = React.useState('')
  const [details, setDetails] = React.useState('')
  const { success, error } = useToast()
  const [submitting, setSubmitting] = React.useState(false)

  const submit = async () => {
    if (!userId.trim()) { error('Report Failed', 'Please enter a user ID'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reportedUserId: parseInt(userId), reason, details })
      })
      if (!res.ok) throw new Error('Report failed')
      success('Report Submitted', 'Thank you. Our team will review this.')
      setUserId(''); setReason(''); setDetails('')
    } catch (e) {
      error('Report Failed', e instanceof Error ? e.message : 'Unable to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <input value={userId} onChange={e=>setUserId(e.target.value)} className="w-40 bg-black/40 border border-gray-900 rounded px-2 py-1 text-sm" placeholder="User ID" />
        <input value={reason} onChange={e=>setReason(e.target.value)} className="flex-1 bg-black/40 border border-gray-900 rounded px-2 py-1 text-sm" placeholder="Reason (e.g. spam, harassment)" />
      </div>
      <textarea value={details} onChange={e=>setDetails(e.target.value)} className="w-full min-h-[80px] bg-black/40 border border-gray-900 rounded px-2 py-1 text-sm" placeholder="Details (optional)"></textarea>
      <div>
        <button onClick={submit} disabled={submitting} className="px-3 py-1 text-sm border border-gray-800 rounded disabled:opacity-50">{submitting?'Submitting…':'Submit Report'}</button>
      </div>
    </div>
  )
}
