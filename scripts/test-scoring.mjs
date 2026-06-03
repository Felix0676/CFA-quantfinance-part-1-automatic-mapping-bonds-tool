import assert from "node:assert/strict";
import { scoreRecords, CREDIT_RATING_SCORES } from "../app/scoring.js";
import { sampleRecords } from "../app/sample-data.js";

const scored = scoreRecords(sampleRecords);

assert.equal(CREDIT_RATING_SCORES.AAA, 100);
assert.equal(CREDIT_RATING_SCORES.D, 0);
assert.equal(scored.length, sampleRecords.length);

for (const record of scored) {
  assert.equal(typeof record.totalScore, "number");
  assert.ok(record.totalScore >= 0 && record.totalScore <= 100);
  assert.ok(record.dataConfidence > 0 && record.dataConfidence <= 100);
}

const singapore = scored.find((record) => record.country === "Singapore");
assert.ok(singapore);
assert.equal(singapore.realYield, 0.8999999999999999);
assert.equal(singapore.dataConfidence, 98.7);
assert.equal(singapore.scoreBreakdown.sovereignRisk.components.creditRating.normalized, 100);
assert.equal(singapore.scoreBreakdown.bondReturnLiquidity.components.yieldToMaturity.benchmark.hundredScoreValue, 4.5);
assert.equal(singapore.scoreBreakdown.bondReturnLiquidity.components.yieldToMaturity.benchmark.zeroScoreValue, 1.1);
assert.equal(singapore.scoreBreakdown.sovereignRisk.components.cdsSpread.benchmark.hundredScoreValue, 11);
assert.equal(singapore.scoreBreakdown.sovereignRisk.components.cdsSpread.benchmark.zeroScoreValue, 38);

const missingHeavyRecord = {
  country: "Missing Data Test",
  region: "Test",
  currency: "TST",
  yieldToMaturity: 4,
  inflationRate: 2,
  creditRating: "BBB"
};

const missingResult = scoreRecords([...sampleRecords, missingHeavyRecord]).find(
  (record) => record.country === "Missing Data Test"
);

assert.ok(missingResult);
assert.ok(missingResult.totalScore !== null);
assert.ok(missingResult.dataConfidence < 50);

const sorted = [...scored].sort((a, b) => b.totalScore - a.totalScore);
assert.equal(sorted[0].country, "Singapore");

console.log("Scoring tests passed.");
