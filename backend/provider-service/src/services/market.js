// Market price aggregation (passive)

function computeQuartiles(sorted) {
  const q = (arr, p) => {
    const idx = (arr.length - 1) * p;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return arr[lo];
    return arr[lo] * (hi - idx) + arr[hi] * (idx - lo);
  };
  return { q1: q(sorted, 0.25), q2: q(sorted, 0.5), q3: q(sorted, 0.75) };
}

function excludeOutliers(values) {
  if (!Array.isArray(values) || values.length === 0) return [];
  const sorted = values.slice().sort((a,b)=>a-b);
  const { q1, q3 } = computeQuartiles(sorted);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return sorted.filter(v => v >= lower && v <= upper);
}

function aggregatePrices(records) {
  // records: array of numbers (prices); return min, avg, max, sample_size
  if (!Array.isArray(records)) return null;
  const clean = excludeOutliers(records);
  if (clean.length === 0) return null;
  const sum = clean.reduce((s,v)=>s+v,0);
  const avg = sum / clean.length;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  return { min_price: min, avg_price: avg, max_price: max, sample_size: clean.length, last_updated: new Date().toISOString() };
}

module.exports = { aggregatePrices, excludeOutliers };
