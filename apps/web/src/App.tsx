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
        background: 'linear-gradient(135deg, #064a98 0%, #1a73e8 100%)',
        color: '#ffffff',
        gap: '1.5rem',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
        Finventree
      </h1>
      <p style={{ fontSize: '1.25rem', opacity: 0.9, margin: 0, maxWidth: '480px' }}>
        Smart inventory management for phone repair shops.
        Track stock, repairs, customers and finances — all in one place.
      </p>
      <p style={{ opacity: 0.7, fontSize: '0.9rem', margin: 0 }}>
        Landing page — coming soon
      </p>
      <a
        href="https://app.finventree.com"
        style={{
          marginTop: '1rem',
          padding: '0.75rem 2rem',
          background: '#ffffff',
          color: '#064a98',
          borderRadius: '0.5rem',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '1rem',
        }}
      >
        Open App →
      </a>
    </div>
  )
}
