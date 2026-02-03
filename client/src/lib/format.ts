export const formatRate = (value: string) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return `${(numeric * 100).toFixed(2)}%`;
};
