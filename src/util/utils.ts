export const removeNaNs = (a: number[]): number[] => {
  const newArray: number[] = [];
  a.forEach((item) => {
    if (!Number.isNaN(item)) {
      newArray.push(item);
    }
  });
  return newArray;
};

export const resetMapObject = (map: MapType<any> | NumMapType<any>) => {
  for (const key in map) {
    if ({}.hasOwnProperty.call(map, key)) {
      delete (map as any)[key];
    }
  }
};

export const resetArray = (a: any[]) => {
  a.length = 0;
};
