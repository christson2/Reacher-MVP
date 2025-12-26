// Trust computation v1 — explainable breakdown

function clamp(v, a=0, b=1) { return Math.max(a, Math.min(b, v)); }

function computeVerificationScore(provider) {
  // simple mapping: verification_level none=0, basic=0.5, trusted=1
  const lvl = (provider.verification_level || 'none');
  if (lvl === 'trusted') return 1;
  if (lvl === 'basic') return 0.5;
  return 0;
}

function computeCompletionScore(stats) {
  // stats: { accepted, completed }
  if (!stats) return 0;
  const accepted = stats.accepted || 0;
  const completed = stats.completed || 0;
  if (accepted === 0) return 0;
  return clamp(completed / accepted, 0, 1);
}

function computeReviewScore(reviews) {
  // reviews: array of { rating: 1-5 }
  if (!Array.isArray(reviews) || reviews.length === 0) return 0;
  const avg = reviews.reduce((s,r)=>s+(r.rating||0),0)/reviews.length;
  return clamp((avg - 1) / 4); // map 1..5 -> 0..1
}

function computeResponseRate(rate) {
  // rate given as 0..1
  return typeof rate === 'number' ? clamp(rate) : 0;
}

function computeAddressConfidence(provider) {
  return typeof provider.address_confidence === 'number' ? clamp(provider.address_confidence/100) : 0;
}

function computeIncidentPenalty(incidents) {
  // incidents: number of recent incidents
  if (!incidents) return 0;
  // scale so that many incidents produce penalty up to 1
  return clamp(Math.min(1, incidents * 0.2));
}

function computeTrustScore(provider, { stats, reviews, response_rate=0, incidents=0 } = {}) {
  const verification_score = computeVerificationScore(provider);
  const job_completion_score = computeCompletionScore(stats);
  const review_score = computeReviewScore(reviews);
  const response_rate_score = computeResponseRate(response_rate);
  const address_confidence_score = computeAddressConfidence(provider);
  const incident_penalty = computeIncidentPenalty(incidents);

  const raw = (0.25 * verification_score) + (0.20 * job_completion_score) + (0.20 * review_score) + (0.15 * response_rate_score) + (0.10 * address_confidence_score) - (0.20 * incident_penalty);
  const score = clamp(raw, 0, 1);
  return {
    trust_score: score,
    breakdown: { verification_score, job_completion_score, review_score, response_rate_score, address_confidence_score, incident_penalty, raw }
  };
}

module.exports = { computeTrustScore, computeVerificationScore };
