export const calculateSkinScores = (journalEntries) => {
  if (!journalEntries || journalEntries.length === 0) {
    return getDefaultScores();
  }

  const last30Days = journalEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return entryDate >= thirtyDaysAgo;
  });

  if (last30Days.length === 0) {
    return getDefaultScores();
  }

  const hydration = calculateHydration(last30Days);
  const barrier = calculateBarrier(last30Days);
  const acne = calculateAcne(last30Days);
  const redness = calculateRedness(last30Days);
  const consistency = calculateConsistency(last30Days);

  const overall = Math.round((hydration + barrier + acne + redness + consistency) / 5);
  const trend = calculateTrend(last30Days);

  return {
    hydration,
    barrier,
    acne,
    redness,
    consistency,
    overall,
    trend,
  };
};

const calculateHydration = (entries) => {
  const hydrationEntries = entries.filter(e => e.hydrationLevel);
  if (hydrationEntries.length === 0) return 50;

  const avg = hydrationEntries.reduce((sum, e) => sum + (e.hydrationLevel || 0), 0) / hydrationEntries.length;
  const acneModifier = entries.filter(e => e.acneLevel && e.acneLevel <= 2).length / entries.length * 25;
  const moodModifier = entries.filter(e => e.mood === 'good').length / entries.length * 25;

  return Math.round(Math.min(100, (avg * 50) + acneModifier + moodModifier));
};

const calculateBarrier = (entries) => {
  const barrierEntries = entries.filter(e => e.barrierHealth);
  if (barrierEntries.length === 0) return 50;

  const avg = barrierEntries.reduce((sum, e) => sum + (e.barrierHealth || 0), 0) / barrierEntries.length;
  const rednessModifier = entries.filter(e => e.rednessLevel && e.rednessLevel <= 2).length / entries.length * 25;
  const textureModifier = entries.filter(e => !e.textureIssues).length / entries.length * 15;

  return Math.round(Math.min(100, (avg * 60) + rednessModifier + textureModifier));
};

const calculateAcne = (entries) => {
  const acneEntries = entries.filter(e => e.acneLevel !== undefined);
  if (acneEntries.length === 0) return 50;

  const avg = acneEntries.reduce((sum, e) => sum + (5 - (e.acneLevel || 0)), 0) / acneEntries.length;
  const routineModifier = entries.filter(e => e.routineCompleted).length / entries.length * 20;
  const symptomPenalty = entries.filter(e => e.acneSymptoms).length / entries.length * -15;

  return Math.round(Math.min(100, Math.max(0, (avg * 70) + routineModifier + symptomPenalty)));
};

const calculateRedness = (entries) => {
  const rednessEntries = entries.filter(e => e.rednessLevel !== undefined);
  if (rednessEntries.length === 0) return 50;

  const avg = rednessEntries.reduce((sum, e) => sum + (5 - (e.rednessLevel || 0)), 0) / rednessEntries.length;
  const moodModifier = entries.filter(e => e.mood === 'good').length / entries.length * 30;

  return Math.round(Math.min(100, (avg * 70) + moodModifier));
};

const calculateConsistency = (entries) => {
  const textureEntries = entries.filter(e => e.textureQuality !== undefined);
  if (textureEntries.length === 0) return 50;

  const avg = textureEntries.reduce((sum, e) => sum + (e.textureQuality || 0), 0) / textureEntries.length;
  const variance = calculateVariance(textureEntries.map(e => e.textureQuality));
  const productConsistency = entries.filter(e => e.productsUsed?.length > 0).length / entries.length * 25;

  return Math.round(Math.min(100, (avg * 50) + ((5 - variance) / 5 * 25) + productConsistency));
};

const calculateVariance = (values) => {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

const calculateTrend = (entries) => {
  if (entries.length < 2) return 'stable';

  const half = Math.ceil(entries.length / 2);
  const firstHalf = entries.slice(0, half);
  const secondHalf = entries.slice(half);

  const firstAvg = firstHalf.reduce((sum, e) => sum + (e.overallSatisfaction || 3), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, e) => sum + (e.overallSatisfaction || 3), 0) / secondHalf.length;

  if (secondAvg > firstAvg + 0.5) return 'improving';
  if (secondAvg < firstAvg - 0.5) return 'worsening';
  return 'stable';
};

const getDefaultScores = () => ({
  hydration: 50,
  barrier: 50,
  acne: 50,
  redness: 50,
  consistency: 50,
  overall: 50,
  trend: 'stable',
});

export const getSkinScoreColor = (score) => {
  if (score >= 80) return '#4CAF50'; // Green
  if (score >= 60) return '#FFC107'; // Amber
  if (score >= 40) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

// Scores from rows of the `journal_entries` table (0-10 scales, snake_case),
// which is what the Journal screen actually saves.
export const scoresFromJournal = (rows = []) => {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const recent = rows.filter(r => r?.date && now - new Date(r.date).getTime() <= 30 * DAY);
  if (recent.length === 0) return null;

  const avg = (list, key) => {
    const values = list.map(r => Number(r[key])).filter(v => Number.isFinite(v));
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  const score = (list) => {
    const hydration = avg(list, 'hydration_level');
    const barrier = avg(list, 'barrier_health');
    const acne = avg(list, 'acne_level');
    const redness = avg(list, 'redness_level');
    return {
      hydration: hydration == null ? 50 : Math.round(hydration * 10),
      barrier: barrier == null ? 50 : Math.round(barrier * 10),
      acne: acne == null ? 50 : Math.round(100 - acne * 10),
      redness: redness == null ? 50 : Math.round(100 - redness * 10),
    };
  };

  const base = score(recent);
  const loggedDays = new Set(recent.filter(r => now - new Date(r.date).getTime() <= 14 * DAY).map(r => new Date(r.date).toDateString())).size;
  const consistency = Math.round(Math.min(1, loggedDays / 14) * 100);
  const overall = Math.round((base.hydration + base.barrier + base.acne + base.redness + consistency) / 5);

  const lastWeek = recent.filter(r => now - new Date(r.date).getTime() <= 7 * DAY);
  const before = recent.filter(r => now - new Date(r.date).getTime() > 7 * DAY);
  let trend = 'stable';
  if (lastWeek.length && before.length) {
    const s = l => { const x = score(l); return (x.hydration + x.barrier + x.acne + x.redness) / 4; };
    const diff = s(lastWeek) - s(before);
    if (diff > 4) trend = 'improving';
    else if (diff < -4) trend = 'worsening';
  }

  return { ...base, consistency, overall, trend, entries: recent.length };
};
