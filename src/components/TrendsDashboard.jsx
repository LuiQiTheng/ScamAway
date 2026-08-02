import React, { useMemo } from 'react';
import { 
  TrendingUp, BarChart2, ShieldAlert, Info, 
  ShieldCheck, Flame, AlertTriangle, Target, HelpCircle, UserCheck, BookOpen, Lightbulb
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { getTodayScamLesson } from '../data/dailyScamLessons';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

export default function TrendsDashboard() {
  const { reportsList, blacklist } = useAppContext();
  const { t, lang } = useLanguage();

  // 1. Retrieve Today's Scam Lesson from daily rotation
  const todayLesson = useMemo(() => {
    return getTodayScamLesson();
  }, []);

  // 2. Dynamic Top Category & Educational Mapping Calculation
  const topCategoryInfo = useMemo(() => {
    if (!reportsList || reportsList.length === 0) {
      return { 
        rawKey: 'parcel', 
        displayName: lang === 'ms' ? 'Scam Penghantaran Bungkusan' : 'Parcel Delivery Scam', 
        guidanceKey: 'trends.guidance_parcel'
      };
    }

    const counts = {};
    reportsList.forEach(r => {
      const cat = (r.category || r.type || 'parcel').toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    const topKey = sortedKeys[0] || 'parcel';

    let displayName = 'Parcel Delivery Scam';
    let guidanceKey = 'trends.guidance_parcel';

    if (topKey.includes('parcel')) {
      displayName = lang === 'ms' ? 'Scam Penghantaran Bungkusan' : 'Parcel Delivery Scam';
      guidanceKey = 'trends.guidance_parcel';
    } else if (topKey.includes('market')) {
      displayName = lang === 'ms' ? 'Scam Pasaran Dalam Talian' : 'Marketplace Scam';
      guidanceKey = 'trends.guidance_marketplace';
    } else if (topKey.includes('bank') || topKey.includes('phish')) {
      displayName = lang === 'ms' ? 'Scam Perbankan & Pancingan Data' : 'Banking & Phishing Scam';
      guidanceKey = 'trends.guidance_banking';
    } else if (topKey.includes('job')) {
      displayName = lang === 'ms' ? 'Scam Tawaran Kerja' : 'Job Offer Scam';
      guidanceKey = 'trends.guidance_job';
    } else if (topKey.includes('invest')) {
      displayName = lang === 'ms' ? 'Skim Pelaburan Palsu' : 'Investment Scam';
      guidanceKey = 'trends.guidance_investment';
    } else if (topKey.includes('gov') || topKey.includes('auth') || topKey.includes('macau')) {
      displayName = lang === 'ms' ? 'Scam Penyamaran Kerajaan' : 'Government Impersonation Scam';
      guidanceKey = 'trends.guidance_government';
    } else {
      displayName = `${topKey.charAt(0).toUpperCase() + topKey.slice(1)} Scam`;
      guidanceKey = 'trends.guidance_default';
    }

    return { rawKey: topKey, displayName, guidanceKey };
  }, [reportsList, lang]);

  // 3. Last Updated Timestamp Computation
  const lastUpdatedDate = useMemo(() => {
    if (!reportsList || reportsList.length === 0) return null;
    const sorted = [...reportsList].sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
    const latest = sorted[0];
    if (!latest) return null;
    const d = new Date(latest.timestamp || latest.date);
    return d.toLocaleDateString(lang === 'ms' ? 'ms-MY' : 'en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [reportsList, lang]);

  // 4. Chronological Timeline Data Sorting
  const timelineData = useMemo(() => {
    if (!reportsList || reportsList.length === 0) return [];
    
    const dateMap = {};
    reportsList.forEach(r => {
      const dateVal = r.timestamp || r.date || new Date().toISOString();
      const d = new Date(dateVal);
      const isoDateKey = d.toISOString().split('T')[0];
      dateMap[isoDateKey] = (dateMap[isoDateKey] || 0) + 1;
    });

    const sortedKeys = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));

    return sortedKeys.map(key => {
      const d = new Date(key);
      return {
        rawDate: key,
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        reports: dateMap[key]
      };
    });
  }, [reportsList]);

  // 5. Dynamic Timeline Trend Message Calculation
  const dynamicTrendMessage = useMemo(() => {
    if (!timelineData || timelineData.length < 2) return t('trends.trend_stable');
    const latest = timelineData[timelineData.length - 1].reports;
    const previous = timelineData[timelineData.length - 2].reports;

    if (latest > previous) return t('trends.trend_increased');
    if (latest < previous) return t('trends.trend_decreased');
    return t('trends.trend_stable');
  }, [timelineData, t]);

  // 6. Category Breakdown Data with Icons
  const categoryData = useMemo(() => {
    if (!reportsList || reportsList.length === 0) return [];
    
    const counts = reportsList.reduce((acc, r) => {
      const cat = r.category || r.type || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const getIconPrefix = (catKey) => {
      const key = catKey.toLowerCase();
      if (key.includes('parcel')) return '📦 ';
      if (key.includes('bank') || key.includes('phish')) return '🏦 ';
      if (key.includes('job')) return '💼 ';
      if (key.includes('invest')) return '💰 ';
      if (key.includes('gov') || key.includes('auth')) return '🏛 ';
      if (key.includes('emerg')) return '🚨 ';
      return '⚠️ ';
    };

    return Object.keys(counts).map(key => ({
      category: `${getIconPrefix(key)}${
        key === "phishing"
          ? t("report.cat_phishing")
          : key === "parcel"
          ? t("report.cat_parcel")
          : key === "job"
          ? t("report.cat_job")
          : key.charAt(0).toUpperCase() + key.slice(1)
      }`,
      count: counts[key]
    }));
  }, [reportsList, t]);

  // 7. Sparse Data Flag (< 5 reports)
  const isSparse = !reportsList || reportsList.length < 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 'var(--content-max)', margin: '0 auto', padding: '1rem' }}>
      
      {/* SECTION 1 — COMMUNITY SCAM ALERT (HERO CARD) */}
      <div 
        className="glass-panel fade-in" 
        style={{ 
          padding: '1.75rem 2rem', 
          borderLeft: '6px solid var(--color-high)', 
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.12)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('trends.hero_eyebrow')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
              <ShieldAlert size={32} color="var(--color-high)" />
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', margin: 0, lineHeight: 1.2 }}>
                {t('trends.title')}
              </h1>
            </div>
          </div>

          {lastUpdatedDate && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              {t('trends.last_updated')} {lastUpdatedDate}
            </span>
          )}
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fca5a5', margin: 0, lineHeight: 1.3 }}>
            {topCategoryInfo.displayName}
          </h2>
          <p style={{ fontSize: '1rem', fontWeight: '500', color: '#cbd5e1', marginTop: '0.35rem', margin: 0 }}>
            {t('trends.alert_top_suffix')}
          </p>
          <p style={{ fontSize: '0.95rem', color: '#f1f5f9', marginTop: '0.85rem', lineHeight: '1.6', margin: 0, background: 'rgba(255,255,255,0.04)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            💡 {t(topCategoryInfo.guidanceKey)}
          </p>
        </div>
      </div>

      {/* SECTION 2 — TODAY'S SCAM LESSON (DAILY ROTATION CARD) */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '1.75rem 2rem', 
          borderLeft: '6px solid var(--primary)', 
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(6, 182, 212, 0.1)'
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.45rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                🎓 {t('trends.lesson_header')}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                {t('trends.lesson_subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Lesson Topic Title */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e0f2fe', margin: 0 }}>
            {todayLesson.topic[lang] || todayLesson.topic.en}
          </h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Who is Targeted? */}
          <div>
            <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.35rem 0' }}>
              <Target size={16} />
              {t('trends.lesson_target_label')}
            </h5>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
              {todayLesson.target[lang] || todayLesson.target.en}
            </p>
          </div>

          {/* How it Works */}
          <div>
            <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.35rem 0' }}>
              <HelpCircle size={16} />
              {t('trends.lesson_how_label')}
            </h5>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
              {todayLesson.howItWorks[lang] || todayLesson.howItWorks.en}
            </p>
          </div>

          {/* Warning Signs */}
          <div>
            <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-caution)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.5rem 0' }}>
              <AlertTriangle size={16} />
              {t('trends.lesson_warning_label')}
            </h5>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {(todayLesson.warningSigns[lang] || todayLesson.warningSigns.en).map((sign, i) => (
                <li key={i} style={{ fontSize: '0.85rem', color: '#f1f5f9', lineHeight: 1.5 }}>
                  {sign}
                </li>
              ))}
            </ul>
          </div>

          {/* Stay Safe Recommendation */}
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-low)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.35rem 0' }}>
              <ShieldCheck size={16} />
              {t('trends.lesson_stay_safe_label')}
            </h5>
            <p style={{ fontSize: '0.9rem', color: '#ecfdf5', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
              💡 {todayLesson.staySafe[lang] || todayLesson.staySafe.en}
            </p>
          </div>

          {/* Did You Know? */}
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '0.85rem 1.25rem' }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fef08a', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.25rem 0' }}>
              <Lightbulb size={15} color="#fef08a" />
              💭 {t('trends.lesson_did_you_know')}
            </h5>
            <p style={{ fontSize: '0.85rem', color: '#fef3c7', margin: 0, lineHeight: 1.5 }}>
              {todayLesson.didYouKnow[lang] || todayLesson.didYouKnow.en}
            </p>
          </div>

        </div>
      </div>

      {/* COMMUNITY INSIGHTS BANNER */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <Info size={22} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
        <div>
          <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.25rem', fontWeight: 600 }}>
            {t('trends.info_title')}
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {t('trends.info_content')}
          </p>
        </div>
      </div>

      {/* SECTION 3 — MOST REPORTED SCAM CATEGORIES (BAR CHART) */}
      {!isSparse && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <BarChart2 size={18} color="var(--primary)" />
              {t('trends.chart_category')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', margin: 0 }}>
              {t('trends.chart_category_sub')}
            </p>
          </div>
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
      )}

      {/* SECTION 4 — SCAM ACTIVITY (LINE CHART WITH DYNAMIC TREND BADGE) */}
      {!isSparse && timelineData.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <TrendingUp size={18} color="var(--primary)" />
                {t('trends.chart_timeline_title')}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', margin: 0 }}>
                {t('trends.chart_timeline_sub')}
              </p>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '20px' }}>
              {dynamicTrendMessage}
            </div>
          </div>
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

    </div>
  );
}