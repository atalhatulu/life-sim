// Shared time model for the forward-simulated Üyük world.
// Dates use a proleptic Gregorian internal calendar; historical date display is separate.
export const VILLAGE_START = "1500-01-01T00:00:00.000Z";
export const LIVE_START = "1600-01-01T00:00:00.000Z";

const parseTime = value => {
  if (typeof value !== "string" || !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$/.test(value)) {
    throw new Error("Expected an ISO UTC timestamp");
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) {
    throw new Error("Invalid UTC timestamp");
  }
  return date;
};

export function lifeStage(age) {
  if (!Number.isInteger(age) || age < 0) throw new Error("Age must be a nonnegative integer");
  if (age < 3) return "infancy";
  if (age < 7) return "early_childhood";
  if (age < 13) return "childhood";
  if (age < 18) return "adolescence";
  if (age < 26) return "youth";
  if (age < 50) return "adulthood";
  if (age < 65) return "later_adulthood";
  return "old_age";
}

export function completedAge(bornAt, at) {
  const birth = parseTime(bornAt), now = parseTime(at);
  if (now < birth) throw new Error("Cannot calculate age before birth");
  let years = now.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayThisYear = Date.UTC(now.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate(),
    birth.getUTCHours(), birth.getUTCMinutes(), birth.getUTCSeconds(), birth.getUTCMilliseconds());
  // Feb 29 birthdays mature on March 1 in non-leap years.
  if (now.getTime() < birthdayThisYear) years--;
  return years;
}

export function timeMode(at) {
  const date = parseTime(at);
  if (date < parseTime(VILLAGE_START)) throw new Error("Village has not started");
  return date < parseTime(LIVE_START) ? "historical" : "live";
}

export function advanceClock(at, {historicalMonths = 1, liveMinutes = 1} = {}) {
  const date = parseTime(at);
  const mode = timeMode(at);
  if (mode === "historical") {
    if (!Number.isInteger(historicalMonths) || historicalMonths < 1) throw new Error("Invalid historical step");
    // Use calendar months, never a fixed 30-day approximation.
    const next = new Date(date);
    next.setUTCDate(1);
    next.setUTCMonth(next.getUTCMonth() + historicalMonths);
    return new Date(Math.min(next.getTime(), parseTime(LIVE_START).getTime())).toISOString();
  }
  if (!Number.isInteger(liveMinutes) || liveMinutes < 1) throw new Error("Invalid live step");
  return new Date(date.getTime() + liveMinutes * 60_000).toISOString();
}
