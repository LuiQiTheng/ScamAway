import React, { useMemo } from 'react';
import { 
  TrendingUp, BarChart2, PieChart as PieIcon, 
  ShieldAlert, CheckCircle, Clock, Database 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, 
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';

export default function TrendsDashboard() {
  const { reportsList, blacklist } = useAppContext();
  const { t } = useLanguage();

  // 1. KPI Computations
  const stats = useMemo(() => {
    const total = reportsList ? reportsList.length : 0;
    const pending = reportsList ? reportsList.filter(r => r.status === 'unverified' || r.status === 'under_review' || r.status === 'pending').length : 0;
    const confirmed = reportsList ? reportsList.filter(r => r.status === 'confirmed').length : 0;
    
    const urlCount = blacklist?.urls?.length || 0;
    const phoneCount = blacklist?.phoneNumbers?.length || 0;
    const accountCount = blacklist?.bankAccounts?.length || 0;
    const blacklistTotal = urlCount + phoneCount + accountCount;

    return { total, pending, confirmed, blacklistTotal };
  }, [reportsList, blacklist]);

  // 2. Chronological Timeline Data Sorting
  const timelineData = useMemo(() => {
    if (!reportsList || reportsList.length === 0) return [];
    
    const dateMap = {};
    reportsList.forEach(r => {
      const dateVal = r.timestamp || r.date || new Date().toISOString();
      const d = new Date(dateVal);
      const isoDateKey = d.toISOString().split('T')[0];
      dateMap[isoDateKey] = (dateMap[isoDateKey] || 0) + 1;
    });

    // Explicit chronological sorting by ISO date key
    const sortedKeys = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));

    return sortedKeys.map(key => {
      const d = new Date(key);
      return {
        rawDate: key,
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reports: dateMap[key]
      };
    });
  }, [reportsList]);

  // 3. Category Breakdown Data
  const categoryData = useMemo(() => {
    if (!reportsList || reportsList.length === 0) return [];
    
    const counts = reportsList.reduce((acc, r) => {
      const cat = r.category || r.type || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(counts).map(key => ({
      category: key.charAt(0).toUpperCase() + key.slice(1),
      count: counts[key]
    }));
  }, [reportsList]);

  // 4. Status Distribution Data
  const statusData = useMemo(() => {
    if (!reportsList || reportsList.length === 0) return [];

    const counts = reportsList.reduce((acc, r) => {
      const statusKey = (r.status === 'unverified' || r.status === 'under_review') ? 'pending' : r.status;
      acc[statusKey] = (acc[statusKey] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: 'Confirmed', value: counts['confirmed'] || 0, color: 'var(--color-low)' },
      { name: 'Pending', value: counts['pending'] || 0, color: 'var(--color-caution)' },
      { name: 'Rejected', value: counts['rejected'] || 0, color: 'var(--color-high)' }
    ].filter(d => d.value > 0);
  }, [reportsList]);

  // Empty State Fallback
  if (!reportsList || reportsList.length === 0) {
    return (
      <div className="glass-panel fade-in" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <TrendingUp size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
        <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>{t('trends.no_data')}</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Header Title */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderLeft: '4px solid var(--primary)' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={24} color="var(--primary)" />
          {t('trends.title')}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {t('trends.subtitle')}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        {/* Total Reports */}
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('trends.kpi_total')}</span>
            <Database size={20} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>{stats.total}</h2>
        </div>

        {/* Pending Review */}
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid var(--color-caution)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('trends.kpi_pending')}</span>
            <Clock size={20} color="var(--color-caution)" />
          </div>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>{stats.pending}</h2>
        </div>

        {/* Confirmed Scams */}
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid var(--color-low)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('trends.kpi_confirmed')}</span>
            <CheckCircle size={20} color="var(--color-low)" />
          </div>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>{stats.confirmed}</h2>
        </div>

        {/* Blacklist Entries */}
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid var(--color-high)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('trends.kpi_blacklist')}</span>
            <ShieldAlert size={20} color="var(--color-high)" />
          </div>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginTop: '0.5rem' }}>{stats.blacklistTotal}</h2>
        </div>

      </div>

      {/* Timeline Line Chart */}
      {timelineData.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--primary)" />
            {t('trends.chart_timeline')}
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="reports" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Bar Chart & Status Pie Chart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Category Breakdown Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={18} color="var(--primary)" />
            {t('trends.chart_category')}
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieIcon size={18} color="var(--primary)" />
            {t('trends.chart_status')}
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
