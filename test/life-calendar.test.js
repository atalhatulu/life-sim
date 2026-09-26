import test from "node:test";
import assert from "node:assert/strict";
import {VILLAGE_START, LIVE_START, completedAge, lifeStage, timeMode, advanceClock} from "../src/life-calendar.js";

test("the village moves from 1500 history to the exact 1600 boundary", () => {
  assert.equal(timeMode(VILLAGE_START), "historical");
  assert.equal(advanceClock("1599-12-01T00:00:00.000Z"), LIVE_START);
  assert.equal(timeMode(LIVE_START), "live");
  assert.equal(advanceClock(LIVE_START), "1600-01-01T00:01:00.000Z");
});

test("historical steps never jump over the live start", () => {
  assert.equal(advanceClock("1599-11-01T00:00:00.000Z", {historicalMonths: 4}), LIVE_START);
});

test("life stages follow completed birthdays, not the calendar year alone", () => {
  const birth = "1500-07-10T00:00:00.000Z";
  assert.equal(completedAge(birth, "1513-07-09T23:59:59.000Z"), 12);
  assert.equal(completedAge(birth, "1513-07-10T00:00:00.000Z"), 13);
  assert.equal(lifeStage(12), "childhood");
  assert.equal(lifeStage(13), "adolescence");
  assert.equal(lifeStage(65), "old_age");
});

test("invalid dates and negative ages are rejected", () => {
  assert.throws(() => timeMode("1500-02-30T00:00:00.000Z"));
  assert.throws(() => completedAge(LIVE_START, VILLAGE_START));
  assert.throws(() => lifeStage(-1));
});
