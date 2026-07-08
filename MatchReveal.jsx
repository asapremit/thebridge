import React, { useState, useEffect } from 'react';

export default function MatchReveal({ userProfile, onSelectGuide }) {
  const [loadingStep, setLoadingStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadingTexts = [
    "Analyzing timeline...",
    "Identifying core bottlenecks...",
    "Curating guide network..."
  ];

  useEffect(() => {
    if (loadingStep < 2) {
      const timer = setTimeout(() => {
        setLoadingStep(prev => prev + 1);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 800); // 600ms + 600ms + 800ms = 2000ms total
      return () => clearTimeout(timer);
    }
  }, [loadingStep]);

  if (loading) {
    return (
      <div 
        id="reveal-loading-container" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: 'var(--bg-primary, #ffffff)',
          gap: '24px',
          boxSizing: 'border-box'
        }}
      >
        <div className="loading-pulse-ring" style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--accent-light, #e0f2fe)' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent, #0284c7)' }}></div>
          <div className="pulse-wave" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '3px solid var(--accent, #0284c7)', opacity: 0, animation: 'pulseWave 1.6s infinite ease-out' }}></div>
        </div>
        <h3 id="reveal-loading-text" style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '2rem', fontStyle: 'italic', color: 'var(--text-primary, #0f172a)', margin: 0, minHeight: '2.5rem' }}>
          {loadingTexts[loadingStep]}
        </h3>
      </div>
    );
  }

  const bottleneck = userProfile?.quizResults?.biggestBottleneck || 'career';
  
  // Dynamic bottleneck display title
  const displayBottleneck = bottleneck === 'status' ? 'Immigration Status' 
    : bottleneck === 'finance' ? 'First-Time Homebuyer' 
    : 'Tech Career Advancement';

  const peerName = bottleneck === 'status' ? 'Elena R.' 
    : bottleneck === 'finance' ? 'Sarah L.' 
    : 'Hassan M.';

  const advisorName = bottleneck === 'status' ? 'Sarah Jenkins, Esq.' 
    : bottleneck === 'finance' ? 'Amanda W.' 
    : 'David Chee';

  // Custom metadata matching specifications
  const peerCopy = bottleneck === 'status' 
    ? "Relocated from Ukraine • Cleared the Consular Backlog Bottleneck in 2023"
    : bottleneck === 'finance'
    ? "Relocated from Brazil • Cleared the Credit Building Bottleneck in 2022"
    : "Relocated from Nigeria • Cleared the Career Bottleneck in 2024";

  const advisorCopy = bottleneck === 'status'
    ? "Immigration Consultant • Helped 150+ users clear Consular Backlog Bottlenecks"
    : bottleneck === 'finance'
    ? "Financial Consultant • Helped 150+ users clear Credit Building Bottlenecks"
    : "Career Consultant • Helped 150+ users clear Career Bottlenecks";

  const handleSelect = (guideId) => {
    if (onSelectGuide) {
      onSelectGuide(guideId);
    }
  };

  return (
    <section 
      id="match-reveal" 
      style={{
        backgroundColor: 'var(--bg-primary, #ffffff)',
        minHeight: '100vh',
        width: '100vw',
        padding: '120px 24px 80px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 id="reveal-diagnosis-h1" style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '2.8rem', fontStyle: 'italic', fontWeight: 700, color: 'var(--text-primary, #0f172a)', lineHeight: 1.2, margin: '0 0 16px 0' }}>
            Your current bottleneck is {displayBottleneck}. We've built your custom roadmap to clear it.
          </h1>
        </div>

        <div id="reveal-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', width: '100%', maxWidth: '900px', margin: '0 auto 40px' }}>
          {/* Card A (Peer Guide) */}
          <div className="guide-match-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', textAlign: 'left', backgroundColor: 'var(--bg-secondary, #f8fafc)' }}>
            <div>
              <span className="match-badge-peer" style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--accent-light, #e0f2fe)', color: 'var(--accent, #0284c7)' }}>Peer Guide</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '12px 0 6px 0', color: 'var(--text-primary, #0f172a)' }}>{peerName}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #64748b)', margin: 0, lineHeight: 1.4 }}>{peerCopy}</p>
            </div>
            <button className="btn btn-primary" onClick={() => handleSelect(peerName)} style={{ marginTop: '20px', width: '100%', padding: '14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              Choose {peerName}
            </button>
          </div>

          {/* Card B (Verified Advisor) */}
          <div className="guide-match-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', textAlign: 'left', backgroundColor: 'var(--bg-secondary, #f8fafc)' }}>
            <div>
              <span className="match-badge-advisor" style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--accent-light, #e0f2fe)', color: 'var(--accent, #0284c7)' }}>Verified Advisor</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '12px 0 6px 0', color: 'var(--text-primary, #0f172a)' }}>{advisorName}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #64748b)', margin: 0, lineHeight: 1.4 }}>{advisorCopy}</p>
            </div>
            <button className="btn btn-primary" onClick={() => handleSelect(advisorName)} style={{ marginTop: '20px', width: '100%', padding: '14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              Choose {advisorName}
            </button>
          </div>
        </div>

        <div>
          <a href="#" onClick={(e) => { e.preventDefault(); handleSelect('unassigned'); }} id="link-skip-reveal" style={{ fontSize: '0.95rem', color: 'var(--text-secondary, #64748b)', textDecoration: 'none', fontWeight: 600, borderBottom: '1px dashed var(--text-secondary, #64748b)' }}>
            Skip for now
          </a>
        </div>
      </div>
    </section>
  );
}
