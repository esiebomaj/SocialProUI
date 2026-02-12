import { useState } from 'react'
import { toast } from 'sonner'

interface TrendingTopic {
  topic: string
  trend_score: number
  platforms: string[]
  post_count: number
  total_engagement: number
  velocity: string
  sample_posts: any[]
}

interface ResolvedPost {
  post_number: number
  url: string
}

interface SampleQuote {
  quote: string
  post_numbers: number[]
  posts: ResolvedPost[]
}

interface ConversationCluster {
  topic: string
  description: string
  mention_count: number
  sentiment: string
  sample_quotes: SampleQuote[]
  subtopics: string[]
  related_posts: ResolvedPost[]
}

interface TrendsData {
  trending_topics: TrendingTopic[]
  conversations: {
    clusters: ConversationCluster[]
    total_posts_analyzed: number
  }
  summary: {
    total_trending_topics: number
    total_posts_analyzed: number
    total_engagement: number
    platform_breakdown: Record<string, number>
    niche_keywords: string[]
    platforms_analyzed: string[]
  }
}

export default function TrendingTopics() {
  const [keywords, setKeywords] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'linkedin', 'twitter'])
  const [loading, setLoading] = useState(false)
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null)

  const analyzeTrends = async () => {
    if (!keywords.trim()) {
      toast.error('Please enter at least one keyword')
      return
    }

    setLoading(true)
    try {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean)

      const response = await fetch('http://localhost:8000/trending-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche_keywords: keywordList,
          platforms: platforms,
          timeframe_hours: 24
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to fetch trends')
      }

      const data = await response.json()
      setTrendsData(data)
      const hashtagCount = data.trending_topics?.length || 0
      const clusterCount = data.conversations?.clusters?.length || 0
      toast.success(`Found ${hashtagCount} hashtags and ${clusterCount} conversation topics!`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze trends')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const togglePlatform = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const platformIcons: Record<string, string> = {
    instagram: '📸',
    linkedin: '💼',
    twitter: '🐦'
  }

  const sentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' }
      case 'negative':
        return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' }
      case 'mixed':
        return { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' }
      default:
        return { bg: 'var(--chip-bg)', color: 'var(--text-muted)' }
    }
  }

  const clusters = trendsData?.conversations?.clusters || []

  return (
    <div>
      {/* Header */}
      <section
        style={{
          padding: '36px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 36, marginBottom: 10, color: 'var(--text-primary)', fontWeight: 700 }}>
          🔥 Trending Topics
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 15 }}>
          Discover trending hashtags and conversations in your niche across Instagram, LinkedIn, and Twitter
        </p>
      </section>

      {/* Input Section */}
      <div style={{ background: 'var(--card-bg)', padding: 28, borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: 14, color: 'var(--text-primary)' }}>
          Niche Keywords
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && keywords.trim() && platforms.length > 0) {
              analyzeTrends()
            }
          }}
          placeholder="e.g., fitness, health, wellness (comma-separated)"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid var(--border-color)',
            borderRadius: 8,
            fontSize: 14,
            marginBottom: 18,
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 0.2s',
            background: 'transparent',
            color: 'var(--text-primary)'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)' }}
        />

        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14, color: 'var(--text-primary)' }}>
          Platforms
        </label>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {['instagram', 'linkedin', 'twitter'].map(platform => (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              style={{
                padding: '10px 18px',
                border: platforms.includes(platform) ? '2px solid #6366f1' : '2px solid var(--border-color)',
                borderRadius: 8,
                background: platforms.includes(platform) ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 14,
                color: platforms.includes(platform) ? '#6366f1' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!platforms.includes(platform)) {
                  e.currentTarget.style.borderColor = '#6366f1'
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (!platforms.includes(platform)) {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: 18 }}>{platformIcons[platform]}</span>
              <span style={{ textTransform: 'capitalize' }}>{platform}</span>
            </button>
          ))}
        </div>

        <button
          onClick={analyzeTrends}
          disabled={loading || platforms.length === 0}
          style={{
            padding: '14px 24px',
            background: loading || platforms.length === 0 ? '#9ca3af' : '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: loading || platforms.length === 0 ? 'not-allowed' : 'pointer',
            width: '100%',
            fontSize: 15,
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            if (!loading && platforms.length > 0) e.currentTarget.style.background = '#4f46e5'
          }}
          onMouseLeave={(e) => {
            if (!loading && platforms.length > 0) e.currentTarget.style.background = '#6366f1'
          }}
        >
          {loading ? '⏳ Analyzing Trends & Conversations...' : '🔥 Analyze Trends'}
        </button>
        {platforms.length === 0 && (
          <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8, marginBottom: 0, fontWeight: 500 }}>
            ⚠️ Please select at least one platform
          </p>
        )}
      </div>

      {/* Summary Cards */}
      {trendsData && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            <SummaryCard value={trendsData.summary.total_trending_topics} label="Trending Hashtags" color="99, 102, 241" />
            <SummaryCard value={clusters.length} label="Conversation Topics" color="168, 85, 247" />
            <SummaryCard value={trendsData.summary.total_posts_analyzed} label="Posts Analyzed" color="236, 72, 153" />
            <SummaryCard value={formatNumber(trendsData.summary.total_engagement)} label="Total Engagement" color="34, 197, 94" />
          </div>

          {/* Two-column results */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            alignItems: 'start',
          }}>
            {/* LEFT: Trending Hashtags */}
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🏷️</span>
                <span>Trending Hashtags</span>
              </h2>

              {trendsData.trending_topics.length === 0 ? (
                <EmptyBlock icon="🔍" title="No trending hashtags" subtitle="Try different keywords" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {trendsData.trending_topics.map((topic, index) => (
                    <div
                      key={index}
                      style={{
                        background: 'var(--card-bg)',
                        padding: 18,
                        borderRadius: 12,
                        border: '1px solid var(--border-color)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            background: index < 3 ? 'rgba(251, 191, 36, 0.2)' : 'var(--chip-bg)',
                            color: index < 3 ? '#fbbf24' : 'var(--text-muted)',
                            padding: '3px 8px',
                            borderRadius: 6,
                            minWidth: 28,
                            textAlign: 'center'
                          }}
                        >
                          #{index + 1}
                        </span>
                        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {topic.topic}
                        </span>
                        <span
                          style={{
                            padding: '3px 10px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#22c55e',
                            borderRadius: 16,
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          {topic.velocity}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap', marginBottom: 8 }}>
                        <span>📊 <strong style={{ color: '#6366f1' }}>{topic.trend_score}</strong></span>
                        <span>📱 <strong style={{ color: 'var(--text-primary)' }}>{topic.post_count}</strong> posts</span>
                        <span>❤️ <strong style={{ color: 'var(--text-primary)' }}>{formatNumber(topic.total_engagement)}</strong></span>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {topic.platforms.map(platform => {
                          const platformColors: Record<string, { bg: string, color: string }> = {
                            instagram: { bg: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' },
                            linkedin: { bg: 'rgba(14, 118, 168, 0.15)', color: '#0e76a8' },
                            twitter: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }
                          }
                          const colors = platformColors[platform] || { bg: 'var(--chip-bg)', color: 'var(--text-secondary)' }
                          return (
                            <span
                              key={platform}
                              style={{
                                padding: '3px 10px',
                                background: colors.bg,
                                color: colors.color,
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <span>{platformIcons[platform]}</span>
                              <span style={{ textTransform: 'capitalize' }}>{platform}</span>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Trending Conversations */}
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>💬</span>
                <span>Trending Conversations</span>
              </h2>

              {clusters.length === 0 ? (
                <EmptyBlock icon="💬" title="No conversations found" subtitle="Try different keywords or more platforms" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {clusters.map((cluster, index) => {
                    const sStyle = sentimentStyle(cluster.sentiment)
                    return (
                      <div
                        key={index}
                        style={{
                          background: 'var(--card-bg)',
                          padding: 18,
                          borderRadius: 12,
                          border: '1px solid var(--border-color)',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#a855f7' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)' }}
                      >
                        {/* Topic header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                            {cluster.topic}
                          </h3>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <span style={{
                              background: 'rgba(168, 85, 247, 0.15)',
                              color: '#a855f7',
                              padding: '3px 10px',
                              borderRadius: 16,
                              fontSize: 11,
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}>
                              {cluster.mention_count} posts
                            </span>
                            <span style={{
                              background: sStyle.bg,
                              color: sStyle.color,
                              padding: '3px 10px',
                              borderRadius: 16,
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}>
                              {cluster.sentiment}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 10px 0', lineHeight: 1.5 }}>
                          {cluster.description}
                        </p>

                        {/* Sample quotes */}
                        <div style={{ marginBottom: 10 }}>
                          {cluster.sample_quotes.map((sq, j) => (
                            <div key={j} style={{ margin: '6px 0' }}>
                              <blockquote
                                style={{
                                  borderLeft: '3px solid #a855f7',
                                  paddingLeft: 12,
                                  margin: 0,
                                  color: 'var(--text-secondary)',
                                  fontSize: 12,
                                  fontStyle: 'italic',
                                  lineHeight: 1.5
                                }}
                              >
                                "{typeof sq === 'string' ? sq : sq.quote}"
                              </blockquote>
                              {typeof sq !== 'string' && sq.posts && sq.posts.length > 0 && (
                                <div style={{ paddingLeft: 15, marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', opacity: 0.7 }}>Sources:</span>
                                  {sq.posts.map((post) => (
                                    <a
                                      key={post.post_number}
                                      href={post.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={`Open post #${post.post_number}`}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3,
                                        padding: '1px 7px',
                                        borderRadius: 4,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        fontStyle: 'normal',
                                        background: 'rgba(168, 85, 247, 0.12)',
                                        color: '#a855f7',
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)'
                                        e.currentTarget.style.transform = 'translateY(-1px)'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)'
                                        e.currentTarget.style.transform = 'translateY(0)'
                                      }}
                                    >
                                      🔗 Post #{post.post_number}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Subtopics */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {cluster.subtopics.map((sub, j) => (
                            <span
                              key={j}
                              style={{
                                background: 'var(--chip-bg)',
                                color: 'var(--text-secondary)',
                                padding: '3px 10px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 500
                              }}
                            >
                              {sub}
                            </span>
                          ))}
                        </div>

                        {/* View all related posts */}
                        {cluster.related_posts && cluster.related_posts.length > 0 && (
                          <button
                            onClick={() => {
                              const urls = cluster.related_posts
                                .filter(p => p.url)
                                .map(p => p.url)
                              if (urls.length === 0) {
                                toast.error('No post URLs available')
                                return
                              }
                              // Open tabs with staggered delays to avoid popup blocker
                              const toOpen = urls.slice(0, 10)
                              // First one opens immediately (user-initiated, never blocked)
                              window.open(toOpen[0], '_blank', 'noopener,noreferrer')
                              // Rest open with small delays so browser allows them
                              toOpen.slice(1).forEach((url, i) => {
                                setTimeout(() => {
                                  window.open(url, '_blank', 'noopener,noreferrer')
                                }, (i + 1) * 300)
                              })
                              toast.info(`Opening ${toOpen.length} posts...`)
                              if (urls.length > 10) {
                                toast.info(`Showing first 10 of ${urls.length} posts`)
                              }
                            }}
                            style={{
                              marginTop: 10,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 14px',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 600,
                              background: 'rgba(168, 85, 247, 0.1)',
                              color: '#a855f7',
                              border: '1px solid rgba(168, 85, 247, 0.25)',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'
                              e.currentTarget.style.borderColor = '#a855f7'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'
                              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.25)'
                            }}
                          >
                            🔗 View all {cluster.related_posts.length} related posts
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!trendsData && !loading && (
        <div style={{
          textAlign: 'center',
          padding: 60,
          background: 'var(--card-bg)',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📈</div>
          <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--text-primary)', fontWeight: 600 }}>
            Ready to discover trends?
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4, maxWidth: 500, margin: '0 auto' }}>
            Enter your niche keywords and select platforms to discover trending hashtags and conversations
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
            We'll analyze Instagram, LinkedIn, and Twitter to find what's hot in your industry
          </p>
        </div>
      )}
    </div>
  )
}


/* ── Reusable sub-components ─────────────────────────────── */

function SummaryCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      padding: 22,
      borderRadius: 12,
      border: `2px solid rgba(${color}, 0.3)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: `linear-gradient(135deg, rgba(${color}, 0.15), rgba(${color}, 0.05))`,
        pointerEvents: 'none'
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: `rgb(${color})`, marginBottom: 4 }}>
          {value}
        </div>
        <div style={{ color: `rgba(${color}, 0.85)`, fontSize: 13, fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </div>
  )
}

function EmptyBlock({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 48,
      background: 'var(--card-bg)',
      borderRadius: 12,
      border: '1px solid var(--border-color)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontSize: 16, marginBottom: 6, color: 'var(--text-primary)', fontWeight: 600 }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
        {subtitle}
      </p>
    </div>
  )
}
