type DateTimePartsToIsoOptions = {
  minYear?: number;
};

const pad2 = (value: number) => String(value).padStart(2, '0');

export function isoToDateTimeLocal(isoValue: string): string {
  if (!isoValue) {
    return '';
  }

  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(
    parsed.getDate(),
  )}T${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
}

export function dateTimeLocalToIso(localDateTimeValue: string): string | null {
  if (!localDateTimeValue) {
    return null;
  }

  const parsed = new Date(localDateTimeValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export function dateTimePartsToIso(
  datePart: string,
  timePart = '00:00',
  options?: DateTimePartsToIsoOptions,
): string | null {
  if (!datePart) {
    return null;
  }

  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null;
  }

  if (options?.minYear !== undefined && year < options.minYear) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}
