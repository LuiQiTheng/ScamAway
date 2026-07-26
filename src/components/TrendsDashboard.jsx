import React, { useState } from 'react';
import { TrendingUp, MapPin, Calendar, Smartphone, FileSpreadsheet, Eye } from 'lucide-react';

export default function TrendsDashboard({ reportsList }) {
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // Summarize stats from reports list
  const confirmedReports = reportsList.filter(r => r.status === 'confirmed');
  
  // Custom seed statistics for demo charts
  const categoriesCount = {
    phishing: confirmedReports.filter(r => r.category === 'phishing').length + 12,
    parcel: confirmedReports.filter(r => r.category === 'parcel').length + 8,
    job: confirmedReports.filter(r => r.category === 'job').length + 15,
    emergency: confirmedReports.filter(r => r.category === 'emergency').length + 6,
    marketplace: confirmedReports.filter(r => r.category === 'marketplace').length + 9,
  };

  const channelCount = {
    whatsapp: 22,
    telegram: 18,
    sms: 14,
    social: 9,
    email: 5
  };

  // Hotspot building database
  const campusBuildings = {
    fsktm: {
      name: "Faculty of Computer Science & IT (FSKTM)",
      totalReports: 14,
      status: "High caution",
      color: "var(--color-caution)",
      commonCategory: "Part-time Job scams via Telegram",
      coordinates: { x: 120, y: 150, r: 24 }
    },
    library: {
      name: "Main Library (Perpustakaan Sultan Abdul Samad)",
      totalReports: 3,
      status: "Low threat",
      color: "var(--color-low)",
      commonCategory: "Public Wi-Fi credential phishing",
      coordinates: { x: 340, y: 100, r: 18 }
    },
    hostels: {
      name: "Student Residential Colleges (Hostels)",
      totalReports: 25,
      status: "Critical",
      color: "var(--color-high)",
      commonCategory: "Pos Laju delivery / COD payment requests",
      coordinates: { x: 230, y: 280, r: 28 }
    },
    studentAffairs: {
      name: "Student Affairs Building (HEPA)",
      totalReports: 6,
      status: "Low threat",
      color: "var(--color-low)",
      commonCategory: "Scholarship & Loan bait documents",
      coordinates: { x: 480, y: 220, r: 16 }
    },
    foodcourt: {
      name: "Pusat Aktiviti Pelajar / Food Court",
      totalReports: 18,
      status: "High caution",
      color: "var(--color-caution)",
      commonCategory: "QR Code payment replacement mismatch",
      coordinates: { x: 420, y: 310, r: 22 }
    }
  };

  const totalMockConfirmed = Object.values(categoriesCount).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Confirmed Scams</span>
            <h2 style={{ fontSize: '1.75rem', color: '#fff', marginTop: '0.25rem' }}>{totalMockConfirmed} cases</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-high)' }}>
            <MapPin size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Most Targeted Zone</span>
            <h2 style={{ fontSize: '1.75rem', color: '#fff', marginTop: '0.25rem' }}>Student Hostels</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-caution)' }}>
            <Smartphone size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Main Threat Vector</span>
            <h2 style={{ fontSize: '1.75rem', color: '#fff', marginTop: '0.25rem' }}>WhatsApp & Telegram</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left: Interactive Campus SVG Hotspot Map */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={22} color="var(--primary)" />
            Interactive Campus Scam Map
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Click on red/orange hotspots to view localized scam reports and current threat advisories for specific faculties or buildings.
          </p>

          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1.6',
            background: 'linear-gradient(135deg, #090e18 0%, #151d30 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {/* Campus SVG layout */}
            <svg viewBox="0 0 600 400" width="100%" height="100%" style={{ display: 'block' }}>
              {/* Grid background */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="600" height="400" fill="url(#grid)" />

              {/* Campus outlines */}
              {/* Roads / Pathways */}
              <path d="M 50,200 Q 250,180 550,220" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <path d="M 300,50 L 300,350" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />

              {/* Building Blocks */}
              {/* FSKTM */}
              <rect x="70" y="110" width="100" height="80" rx="6" fill="#1e293b" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x="120" y="140" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">FSKTM COMPUTER</text>

              {/* Library */}
              <rect x="290" y="60" width="100" height="80" rx="8" fill="#1e293b" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x="340" y="100" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">MAIN LIBRARY</text>

              {/* Hostels */}
              <rect x="170" y="240" width="120" height="80" rx="6" fill="#1e293b" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x="230" y="275" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">STUDENT HOSTELS</text>

              {/* HEPA */}
              <rect x="430" y="180" width="100" height="60" rx="6" fill="#1e293b" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x="480" y="215" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">HEPA ADMIN</text>

              {/* Food Court */}
              <rect x="360" y="270" width="120" height="70" rx="6" fill="#1e293b" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x="420" y="305" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">STUDENT FOOD COURT</text>

              {/* Interactive Hotspot Nodes */}
              {Object.entries(campusBuildings).map(([key, data]) => (
                <g 
                  key={key} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedBuilding(data)}
                >
                  {/* Outer pulsing ring */}
                  <circle 
                    cx={data.coordinates.x} 
                    cy={data.coordinates.y} 
                    r={data.coordinates.r + 4} 
                    fill="none" 
                    stroke={data.color} 
                    strokeWidth="2" 
                    opacity="0.4"
                  >
                    <animate attributeName="r" values={`${data.coordinates.r};${data.coordinates.r + 10};${data.coordinates.r}`} dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.0;0.4" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  
                  {/* Central Node */}
                  <circle 
                    cx={data.coordinates.x} 
                    cy={data.coordinates.y} 
                    r={data.coordinates.r} 
                    fill={data.color} 
                    opacity="0.25"
                  />
                  <circle 
                    cx={data.coordinates.x} 
                    cy={data.coordinates.y} 
                    r="8" 
                    fill={data.color}
                  />
                  
                  {/* Text value indicator inside */}
                  <text 
                    x={data.coordinates.x} 
                    y={data.coordinates.y + 4} 
                    fill="#fff" 
                    fontSize="11" 
                    fontWeight="700" 
                    textAnchor="middle"
                  >
                    {data.totalReports}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover details bubble overlay */}
            {selectedBuilding && (
              <div 
                className="fade-in"
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: `1px solid ${selectedBuilding.color}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  zIndex: 20
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{selectedBuilding.name}</strong>
                  <span className="badge" style={{ 
                    background: `${selectedBuilding.color}20`, 
                    color: selectedBuilding.color,
                    border: `1px solid ${selectedBuilding.color}40`,
                    fontSize: '0.75rem' 
                  }}>
                    {selectedBuilding.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Common Trend: <strong>{selectedBuilding.commonCategory}</strong>
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Total Verified Scams: <strong>{selectedBuilding.totalReports} active cases</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Category and Vector breakdown charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Categories Chart */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--primary)" />
              Top Scam Formats
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(categoriesCount).map(([key, value]) => {
                const percentage = Math.round((value / totalMockConfirmed) * 100);
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                        {key === 'phishing' ? '🔗 Link Phishing' : ''}
                        {key === 'parcel' ? '📦 Parcel / Delivery' : ''}
                        {key === 'job' ? '💼 Part-time Job' : ''}
                        {key === 'emergency' ? '🚨 Family Emergency' : ''}
                        {key === 'marketplace' ? '🛍️ Trading/Market' : ''}
                      </span>
                      <strong style={{ color: 'var(--primary)' }}>{value} ({percentage}%)</strong>
                    </div>
                    {/* Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: 'linear-gradient(to right, var(--primary), var(--primary-dark))', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident vectors */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone size={18} color="var(--primary)" />
              Report Channels
            </h3>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-around' }}>
              {Object.entries(channelCount).map(([channel, val]) => (
                <div key={channel} style={{ textAlign: 'center', minWidth: '70px', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>{channel}</span>
                  <strong style={{ fontSize: '1.35rem', color: '#fff', marginTop: '0.25rem', display: 'block' }}>{val}</strong>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
