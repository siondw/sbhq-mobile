export const groupBy = <T, K extends PropertyKey>(
  xs: T[],
  key: (t: T) => K,
): Record<K, T[]> =>
  xs.reduce(
    (m, x) => {
      const k = key(x);
      (m[k] ??= []).push(x);
      return m;
    },
    {} as Record<K, T[]>,
  );

export const keyBy = <T, K extends PropertyKey>(xs: T[], key: (t: T) => K): Record<K, T> =>
  xs.reduce(
    (m, x) => {
      m[key(x)] = x;
      return m;
    },
    {} as Record<K, T>,
  );

export const sum = (xs: number[]) => xs.reduce((acc, x) => acc + x, 0);
