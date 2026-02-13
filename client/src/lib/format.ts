export const formatRate = (value: string) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return `${(numeric * 100).toFixed(2)}%`;
};

export const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
