export const UI_LOCALE = "es-PA";

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

export const formatUiDateTime = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions
): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValidDate(date)) return "";
  return new Intl.DateTimeFormat(UI_LOCALE, options).format(date);
};

export const formatUiTime = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }
): string => formatUiDateTime(value, options);

export const formatUiDate = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions
): string => formatUiDateTime(value, options);
