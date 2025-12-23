import { useState } from 'react'

type Creator = {
  username: string
  url: string
  fullName?: string
  biography?: string
  followersCount?: number
  followsCount?: number
  postsCount?: number
  profilePicUrl?: string
  // Emergence score fields (only present when sortByEmergence is true)
  emergence_score?: number
  engagement_rate?: number
  ff_ratio?: number
  avg_likes?: number
  avg_comments?: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function Creators() {
  const [keyword, setKeyword] = useState('')
  const [country, setCountry] = useState('')
  const [followersMin, setFollowersMin] = useState<string>('')
  const [followersMax, setFollowersMax] = useState<string>('')
  const [sortByEmergence, setSortByEmergence] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creators, setCreators] = useState<Creator[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setCreators([])

    try {
      const response = await fetch(`${API_BASE_URL}/creators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          country,
          followers_count_gt: followersMin ? Number(followersMin) : undefined,
          followers_count_lt: followersMax ? Number(followersMax) : undefined,
          sort_by_emergence: sortByEmergence,
        }),
      })
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }
      const data: any = await response.json()

      const items: any[] = Array.isArray(data) ? data : Object.values(data)
      const list: Creator[] = items.map((c: any) => ({
        username: c.username,
        url: c.url ?? `https://www.instagram.com/${c.username}`,
        fullName: c.fullName,
        biography: c.biography,
        followersCount: c.followersCount,
        followsCount: c.followsCount,
        postsCount: c.postsCount,
        profilePicUrl: c.profilePicUrlHD ?? c.profilePicUrl,
        // Emergence score fields
        emergence_score: c.emergence_score,
        engagement_rate: c.engagement_rate,
        ff_ratio: c.ff_ratio,
        avg_likes: c.avg_likes,
        avg_comments: c.avg_comments,
      }))

      setCreators(list)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch creators')
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#16a34a'
    if (score >= 60) return '#ca8a04'
    if (score >= 40) return '#ea580c'
    return '#dc2626'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '🔥 High Potential'
    if (score >= 60) return '📈 Growing'
    if (score >= 40) return '🌱 Emerging'
    return '🔍 Early Stage'
  }

  const hasResults = creators.length > 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 28, minHeight: 'calc(100vh - 72px)' }}>
      <aside
        style={{
          position: 'sticky',
          top: 24,
          alignSelf: 'start',
          padding: 20,
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 4 }}>Creator Finder</h2>
        <p style={{ marginTop: 0, color: '#666' }}>Find Instagram creators that match your needs.</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, marginTop: 16 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Hashtag / Keyword</span>
            <input
              type="text"
              placeholder="#fitness, skincare, ..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              required
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>Country</span>
            <input
              type="text"
              placeholder="e.g., Nigeria, USA"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Followers ≥</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="min"
                value={followersMin}
                onChange={(e) => setFollowersMin(e.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Followers ≤</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="max"
                value={followersMax}
                onChange={(e) => setFollowersMax(e.target.value)}
              />
            </label>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              background: sortByEmergence ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0,0,0,0.02)',
              border: sortByEmergence ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(0,0,0,0.08)',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="checkbox"
              checked={sortByEmergence}
              onChange={(e) => setSortByEmergence(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>🚀 Sort by Growth Potential</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                Rank creators by engagement & virality signals
              </div>
            </div>
          </label>

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching…' : 'Find Creators'}
          </button>

          {error && <div style={{ color: 'crimson' }}>{error}</div>}
          <div style={{ color: '#777', fontSize: 12 }}>
            Tip: Country and follower filters are optional.
          </div>
        </form>
      </aside>

      <main style={{ padding: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Creators</h3>
          {!isLoading && hasResults && (
            <div style={{ color: '#666', fontSize: 12 }}>{creators.length} result{creators.length !== 1 ? 's' : ''}</div>
          )}
        </div>
        {!isLoading && !hasResults && <div style={{ color: '#666' }}>No creators yet. Run a search.</div>}
        {isLoading && (
          <div className="loading-center">
            <div className="spinner" />
            <div>Loading creators…</div>
            <div style={{ color: '#666', maxWidth: 420 }}>
              This might take a little time depending on your keyword and network. Please keep this tab open.
            </div>
          </div>
        )}
        {!isLoading && hasResults && (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20,
            }}
          >
            {creators.map((c, index) => (
              <li
                key={c.username}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  padding: 14,
                  background: 'var(--card-bg)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  position: 'relative',
                }}
              >
                {/* Rank badge when sorting by emergence */}
                {sortByEmergence && c.emergence_score && index < 3 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: 12,
                      background: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#cd7f32',
                      color: index === 0 ? '#000' : '#fff',
                      padding: '3px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'help',
                    }}
                    title={`Top ${index + 1} creator by growth potential in this niche`}
                  >
                    #{index + 1}
                  </div>
                )}

                {/* Emergence score header */}
                {c.emergence_score !== undefined && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                      paddingBottom: 10,
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'help' }}
                      title="Growth Potential Score (0-100): Combines engagement rate, follower/following ratio, account size, and posting activity to predict viral potential."
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: `conic-gradient(${getScoreColor(c.emergence_score)} ${c.emergence_score}%, #e5e7eb ${c.emergence_score}%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--card-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 12,
                            color: 'black', //getScoreColor(c.emergence_score),
                          }}
                        >
                          {c.emergence_score}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#666' }}>Growth Potential</div>
                        <div style={{ fontWeight: 600, fontSize: 12, color: getScoreColor(c.emergence_score) }}>
                          {getScoreLabel(c.emergence_score)}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{ textAlign: 'right', cursor: 'help' }}
                      title="Engagement Rate: (Avg Likes + Comments) ÷ Followers × 100. Higher is better. 3%+ is excellent, 1-3% is good."
                    >
                      <div style={{ fontSize: 11, color: '#666' }}>Engagement</div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.engagement_rate}%</div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-primary)' }}>
                  {c.profilePicUrl ? (
                    <img
                      src={c.profilePicUrl ? `${API_BASE_URL}/proxy-image?url=${encodeURIComponent(c.profilePicUrl)}` : undefined}
                      alt={c.username}
                      width={56}
                      height={56}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      style={{ borderRadius: '50%', objectFit: 'cover', background: '#eee' }}
                      onError={(e) => {
                        const img = e.currentTarget
                        const svg = encodeURIComponent(
                          `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>\n  <rect width='100%' height='100%' rx='24' ry='24' fill='#e5e7eb'/>\n</svg>`
                        )
                        img.src = `data:image/svg+xml;charset=UTF-8,${svg}`
                      }}
                    />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eee' }} />
                  )}
                  <div>
                    <a href={c.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
                      @{c.username}
                    </a>
                    {c.fullName && <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{c.fullName}</div>}
                  </div>
                </div>

                {/* Stats row - enhanced when emergence data available */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {typeof c.followersCount === 'number' && (
                    <span style={{ fontSize: 12, background: 'var(--chip-bg)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: 999 }}>
                      Followers: {c.followersCount.toLocaleString()}
                    </span>
                  )}
                  {c.ff_ratio !== undefined && (
                    <span
                      style={{ fontSize: 12, background: 'var(--chip-bg)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: 999, cursor: 'help' }}
                      title="Follower/Following Ratio: Followers ÷ Following. Higher ratio (5x+) indicates organic growth — people follow them without follow-backs."
                    >
                      F/F: {c.ff_ratio}x
                    </span>
                  )}
                  {typeof c.postsCount === 'number' && (
                    <span style={{ fontSize: 12, background: 'var(--chip-bg)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: 999 }}>
                      Posts: {c.postsCount}
                    </span>
                  )}
                  {c.avg_likes !== undefined && (
                    <span
                      style={{ fontSize: 12, background: 'var(--chip-bg)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: 999, cursor: 'help' }}
                      title="Average Likes: Mean number of likes per post from recent content. Shows consistent audience engagement."
                    >
                      Avg Likes: {c.avg_likes >= 1000 ? `${(c.avg_likes / 1000).toFixed(1)}K` : c.avg_likes}
                    </span>
                  )}
                </div>


                {c.biography && (
                  <p style={{ marginTop: 10, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: 13, maxHeight: 60, overflow: 'hidden' }}>{c.biography}</p>
                )}
                <div style={{ marginTop: 10 }}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '8px 10px',
                      background: 'rgba(100,119,255,0.12)',
                      borderRadius: 8,
                      fontSize: 13,
                      textDecoration: 'none',
                      color: 'var(--text-primary)'
                    }}
                  >
                    View Profile ↗
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}


