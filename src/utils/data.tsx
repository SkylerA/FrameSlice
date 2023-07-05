export type ObjArray = { [key: string]: any }[];
export type ImgObj = {
  url: string;
  file: File;
  classStr: string;
};

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type Json = JsonObject | JsonArray | null;

export interface JsonCallback {
  (json: Json): void;
}

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

export const classStrSort = (a: ImgObj, b: ImgObj) => {
  if (a.classStr < b.classStr) return -1;
  if (b.classStr < a.classStr) return 1;
  return 0;
};

// selected with [] implies all classes besides ignored
export const filterAndIgnoreImgObjs = (
  objs: ImgObj[],
  selected: string[],
  ignore: string[]
) => {
  // Assume all if selected array is empty or only "" is passed
  const showAll =
    selected.length < 1 || (selected.length === 1 && selected[0] === "");

  return Array.from(objs).filter((obj) =>
    !ignore.includes(obj.classStr) && showAll
      ? true
      : selected.includes(obj.classStr)
  );
};

// Helper function to keep typescript from complaining about object.blah references for json results that are typed as objects for now
export const hasGet = <T,>(obj: object, field: string): T | undefined =>
  Object.hasOwn(obj, field) ? (obj[field as keyof typeof obj] as T) : undefined;

export function loadJson(file: File, callback: JsonCallback | undefined) {
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const json = JSON.parse(event.target?.result as string) as unknown;
        callback?.(json as JsonObject | JsonArray);
      } catch (error) {
        console.error("Error while loading JSON: ", error);
        callback?.(null);
      }
    };
    reader.readAsText(file);
  }
}
