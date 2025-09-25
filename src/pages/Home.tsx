import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section
        style={{
          padding: '48px 32px',
          background:
            'linear-gradient(135deg, rgba(100,119,255,0.08), rgba(100,119,255,0.02))',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 32 }}>Warmer Socials</h1>
        <p style={{ marginTop: 8, color: '#555', maxWidth: 720 }}>
          Marketing and social media automation platform to help you discover creators and scale outreach.
        </p>
      </section>

      {/* Tools grid */}
      <section style={{ marginTop: 28 }}>
        <h3 style={{ marginTop: 0 }}>Tools</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          <Link
            to="/post-insight"
            style={{
              display: 'block',
              padding: 18,
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 12,
              textDecoration: 'none',
              color: 'inherit',
              background: 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#eff2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                ✍️
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 700, color: '#333' }}>Post Insight →</div>
              </div>
            </div>
            <div style={{ color: '#666' }}>
              Analyze a blog post or video to generate a social media brief and related posts.
            </div>
          </Link>
          <Link
            to="/creators"
            style={{
              display: 'block',
              padding: 18,
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 12,
              textDecoration: 'none',
              color: 'inherit',
              background: 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#eff2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                🔎
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 700, color: '#333' }}>Creator Finder →</div>
              </div>
            </div>
            <div style={{ color: '#666' }}>
              Discover Instagram creators by keyword, optional country, and follower count.
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}


