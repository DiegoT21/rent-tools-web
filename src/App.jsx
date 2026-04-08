import { useState } from 'react'
import './App.css'

function App() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const tools = [
    { id: 1, icon: '🔨', title: 'Power Tools', desc: 'Heavy duty drills, saws, and machinery for your biggest home improvement projects.' },
    { id: 2, icon: '🌿', title: 'Gardening & Lawning', desc: 'Cultivate your outdoor spaces with premium mowers, trimmers, and landscape tools.' },
    { id: 3, icon: '📷', title: 'A/V Equipment', desc: 'Capture perfect moments with professional cameras, lighting, and audio gear.' }
  ];

  return (
    <>
      {/* Decorative Background Elements */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <nav className="navbar glass-panel">
        <div className="nav-logo">
          Rent<span className="text-gradient">Tools</span>
        </div>
        <ul className="nav-links">
          <li><a href="#" className="nav-link">Explore</a></li>
          <li><a href="#" className="nav-link">How it Works</a></li>
          <li><a href="#" className="nav-link">Login</a></li>
        </ul>
      </nav>

      <main className="hero">
        <h1>
          Rent the best <br />
          <span className="text-gradient">equipment</span> near you.
        </h1>
        <p>
          Don't buy expensive tools for a single project. Access premium equipment from trusted local owners in your community and get the job done right.
        </p>
        <div className="hero-buttons">
          <button className="btn btn-primary">Start Renting</button>
          <button className="btn btn-secondary">List Your Tools</button>
        </div>
      </main>

      <section className="features">
        <div className="features-grid">
          {tools.map((tool, index) => (
            <div 
              key={tool.id} 
              className="feature-card glass-panel"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                boxShadow: hoveredIndex === index ? '0 15px 45px rgba(59, 130, 246, 0.15)' : ''
              }}
            >
              <div className="feature-icon">{tool.icon}</div>
              <h3>{tool.title}</h3>
              <p>{tool.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default App
