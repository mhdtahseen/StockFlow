export default function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: '#f8fafc',
        color: '#0f172a',
        gap: '1rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
        Finventree Admin
      </h1>
      <p style={{ color: '#64748b', margin: 0 }}>
        Admin panel — under construction
      </p>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
        Subdomain: <strong>admin.finventree.com</strong>
      </p>
    </div>
  )
}
