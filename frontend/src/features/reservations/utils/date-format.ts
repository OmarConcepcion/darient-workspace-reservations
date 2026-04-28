export const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

export const formatDateTimeRange = (startsAt: string, endsAt: string): string =>
  `${formatDateTime(startsAt)} - ${formatDateTime(endsAt)}`;

export const formatIsoTime = (value: string): string => {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

export const formatTimeRange = (startsAt: string, endsAt: string): string =>
  `${startsAt} - ${endsAt}`;

export const formatDateInputLabel = (value: string): string =>
  new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

export const formatDuration = (startsAt: string, endsAt: string): string => {
  const minutes = Math.max(
    0,
    Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000)
  );
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
};

export const todayDateInputValue = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
