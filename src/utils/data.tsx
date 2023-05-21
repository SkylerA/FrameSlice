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
