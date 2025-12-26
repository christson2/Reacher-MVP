// Ranking service: computes normalized scores and final weighted score

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

// distance_km -> distance_score (0..1), closer=>1
// use simple decay: score = max(0, 1 - (d / maxDistance)) where maxDistance defaults to 100 km
function distanceScore(distance_km, maxDistance=100) {
  if (distance_km === null || distance_km === undefined) return 0;
  const s = 1 - (distance_km / maxDistance);
  return clamp01(s);
}

// relevance: expected precomputed (0..1). If raw text provided, caller should compute semantic relevance.

// price_score: relative to market avg. We expect price and marketAvg; higher price -> lower score.
// price_score = clamp(1 - (price - avg)/avg) mapped 0..1, if price missing -> 0.5
function priceScore(price, marketAvg) {
  if (price === undefined || price === null) return 0.5;
  if (!marketAvg || marketAvg <= 0) return 0.5;
  const ratio = (price - marketAvg) / marketAvg; // positive means above avg
  const s = 1 - ratio; // above avg reduces score
  return clamp01(s);
}

// availability_score: 0..1, 1 means highly available

function computeFinalScore({ distance_km, relevance_score=0, trust_score=0, price, marketAvg, availability_score=0 }, weights={ distance:0.35, relevance:0.30, trust:0.20, price:0.10, availability:0.05 }) {
  const d = distanceScore(distance_km);
  const p = priceScore(price, marketAvg);
  const r = clamp01(relevance_score);
  const t = clamp01(trust_score);
  const a = clamp01(availability_score);
  const final = (weights.distance * d) + (weights.relevance * r) + (weights.trust * t) + (weights.price * p) + (weights.availability * a);
  return { final_score: clamp01(final), components: { distance: d, relevance: r, trust: t, price: p, availability: a } };
}

module.exports = { distanceScore, priceScore, computeFinalScore };
