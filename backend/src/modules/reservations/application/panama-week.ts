const PANAMA_UTC_OFFSET_MS = -5 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const getPanamaWeekRange = (
  date: Date
): { startsAt: Date; endsAt: Date } => {
  const panamaDate = new Date(date.getTime() + PANAMA_UTC_OFFSET_MS);
  const dayOfWeek = panamaDate.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const weekStartInPanamaTime = Date.UTC(
    panamaDate.getUTCFullYear(),
    panamaDate.getUTCMonth(),
    panamaDate.getUTCDate() - daysSinceMonday,
    0,
    0,
    0,
    0
  );
  const startsAt = new Date(weekStartInPanamaTime - PANAMA_UTC_OFFSET_MS);

  return {
    startsAt,
    endsAt: new Date(startsAt.getTime() + ONE_WEEK_MS)
  };
};
