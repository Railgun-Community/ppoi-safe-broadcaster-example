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

export const resetMapObject = <T>(map: MapType<T> | NumMapType<T>) => {
  for (const key in map) {
    if ({}.hasOwnProperty.call(map, key)) {
      // eslint-disable-next-line no-param-reassign
      delete (map as MapType<T>)[key];
    }
  }
};

export const bigIntToHex = (n: bigint): string => {
  return `0x${n.toString(16)}`;
};

export const resetArray = (a: object[]) => {
  // eslint-disable-next-line no-param-reassign
  a.length = 0;
};

export const randomElement = <T>(list: T[]): Optional<T> => {
  if (list.length === 0) {
    return undefined;
  }
  return list[Math.floor(Math.random() * list.length)];
};

export const maxBigInt = (b1: bigint, b2: bigint) => {
  return b1 > b2 ? b1 : b2;
};

export const minBigInt = (b1: bigint, b2: bigint) => {
  return b1 < b2 ? b1 : b2;
};
