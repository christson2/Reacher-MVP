const assert = require('assert');
const ranking = require('../src/services/ranking');
const trust = require('../src/services/trust');
const market = require('../src/services/market');

describe('Domain logic: ranking, trust, market aggregation', function() {
  it('ranking orders closer providers higher', function() {
    const a = ranking.computeFinalScore({ distance_km: 1, relevance_score: 0.8, trust_score: 0.5, price: 80, marketAvg: 100, availability_score: 0.9 });
    const b = ranking.computeFinalScore({ distance_km: 20, relevance_score: 0.8, trust_score: 0.5, price: 80, marketAvg: 100, availability_score: 0.9 });
    assert(a.final_score > b.final_score, 'closer should score higher');
  });

  it('trust score within bounds and breakdown present', function() {
    const provider = { verification_level: 'trusted', address_confidence: 80 };
    const out = trust.computeTrustScore(provider, { stats: { accepted: 10, completed: 9 }, reviews: [{rating:5},{rating:4}], response_rate: 0.9, incidents: 0 });
    assert(out.trust_score >=0 && out.trust_score <=1, 'trust score bounds');
    assert(out.breakdown, 'breakdown present');
  });

  it('market aggregation excludes obvious outliers', function() {
    const recs = [100, 110, 95, 105, 1000]; // 1000 is outlier
    const agg = market.aggregatePrices(recs);
    assert(agg.sample_size === 4, 'outlier excluded');
    assert(agg.avg_price < 200, 'avg reasonable');
  });
});
