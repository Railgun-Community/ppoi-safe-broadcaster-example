export const removeNaNs = (a: number[]): number[] => {
  const newArray: number[] = [];
  a.forEach((item) => {
    if (!Number.isNaN(item)) {
      newArray.push(item);
    }
  });
  return newArray;
};

export function removeUndefineds<T>(a: Optional<T>[]): T[] {
  const newArray: T[] = [];
  for (const item of a) {
    if (item != null) {
      newArray.push(item);
    }
  }
  return newArray;
}

export const resetMapObject = (map: MapType<any> | NumMapType<any>) => {
  for (const key in map) {
    if ({}.hasOwnProperty.call(map, key)) {
      // eslint-disable-next-line no-param-reassign
      delete (map as any)[key];
    }
  }
};

export const resetArray = (a: any[]) => {
  // eslint-disable-next-line no-param-reassign
  a.length = 0;
};
