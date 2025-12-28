const assert = require('assert');
const ranking = require('../src/services/ranking');
const trust = require('../src/services/trust');
const market = require('../src/services/market');

describe('Services module unit tests', function() {
  describe('ranking', function() {
    it('distanceScore maps 0km -> 1 and far -> 0', function() {
      assert.strictEqual(ranking.distanceScore(0), 1);
      assert(ranking.distanceScore(1000) < 0.01);
    });

    it('priceScore gives 0.5 when marketAvg missing', function() {
      assert.strictEqual(ranking.priceScore(100, null), 0.5);
    });

    it('computeFinalScore returns components and final_score between 0 and 1', function() {
      const out = ranking.computeFinalScore({ distance_km: 5, relevance_score: 0.8, trust_score: 0.6, price: 90, marketAvg: 100, availability_score: 0.7 });
      assert(typeof out.final_score === 'number');
      assert(out.final_score >= 0 && out.final_score <= 1);
      assert(out.components && out.components.distance !== undefined);
    });
  });

  describe('trust', function() {
    it('computeVerificationScore maps levels correctly', function() {
      assert.strictEqual(trust.computeVerificationScore({ verification_level: 'trusted' }), 1);
      assert.strictEqual(trust.computeVerificationScore({ verification_level: 'basic' }), 0.5);
      assert.strictEqual(trust.computeVerificationScore({}), 0);
    });

    it('computeTrustScore returns breakdown and score within 0..1', function() {
      const provider = { verification_level: 'basic', address_confidence: 80 };
      const stats = { accepted: 10, completed: 9 };
      const reviews = [{ rating: 5 }, { rating: 4 }];
      const out = trust.computeTrustScore(provider, { stats, reviews, response_rate: 0.9, incidents: 0 });
      assert(out.trust_score >= 0 && out.trust_score <= 1);
      assert(out.breakdown);
    });
  });

  describe('market', function() {
    it('excludeOutliers removes extreme values', function() {
      const arr = [10,12,11,1000,13];
      const clean = market.excludeOutliers(arr);
      assert(clean.indexOf(1000) === -1);
    });

    it('aggregatePrices computes avg/min/max and sample_size', function() {
      const agg = market.aggregatePrices([50,55,45,52]);
      assert(agg.sample_size === 4);
      assert(agg.avg_price > 0);
      assert(agg.min_price <= agg.max_price);
    });
  });
});
