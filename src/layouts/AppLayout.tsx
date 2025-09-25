import type { PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import logoUrl from '../assets/logo.png'

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <div>
      <nav
        style={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          padding: '10px 42px',
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}
     >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'inherit', textDecoration: 'none' }}>
          <img src={logoUrl} alt="WarmerSocials" width={56} height={56} style={{ borderRadius: 10 }} />
          <span style={{ fontWeight: 800, fontSize: 20 }}>Warmer Socials</span>
        </Link>
      </nav>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  )
}


