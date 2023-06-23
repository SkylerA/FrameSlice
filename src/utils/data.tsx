export type ObjArray = { [key: string]: any }[];

// This creates a map of arrays that will auto generate the array the first time a bucket is accessed
type AutoArrayMap<T> = { [key: string]: T[] };
export function createAutoArrayMap<T>(): AutoArrayMap<T> {
  const map: AutoArrayMap<T> = {};

  return new Proxy(map, {
    get(target, property) {
      if (!(property in target)) {
        target[property as string] = [];
      }

      return target[property as string];
    },
  });
}

export const clamp = (num: number, min: number, max: number) =>
  Math.max(min, Math.min(max, num));

// groupBy provide by https://stackoverflow.com/a/62765924/81008
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const groupBy = <T, K extends keyof any>(
  list: T[],
  getKey: (item: T) => K
) =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
  }, {} as Record<K, T[]>);

export function fetchGetJson(response: Response) {
  if (!response.ok) {
    throw Error(response.statusText);
  } else {
    return response.json();
  }
}
