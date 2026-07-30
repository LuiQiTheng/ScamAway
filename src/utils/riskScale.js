const RISK_BANDS = [
  { minimum: 80, color: 'critical', en: 'Critical', ms: 'Kritikal' },
  { minimum: 60, color: 'high', en: 'High risk', ms: 'Berisiko tinggi' },
  { minimum: 40, color: 'caution', en: 'Caution', ms: 'Awas' },
  { minimum: 20, color: 'caution', en: 'Needs verification', ms: 'Perlu Pengesahan' },
  { minimum: 0, color: 'low', en: 'Low evidence', ms: 'Bukti Rendah' },
];

export function getRiskBand(score, lang = 'en') {
  const numericScore = Number(score);
  const boundedScore = Number.isFinite(numericScore)
    ? Math.min(100, Math.max(0, numericScore))
    : 0;
  const band =
    RISK_BANDS.find(({ minimum }) => boundedScore >= minimum) ??
    RISK_BANDS[RISK_BANDS.length - 1];

  return {
    key: band.en.toLowerCase().replace(/\s+/g, '_'),
    label: lang === 'ms' ? band.ms : band.en,
    color: band.color,
  };
}
