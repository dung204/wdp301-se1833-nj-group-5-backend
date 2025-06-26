import { ClassConstructor, plainToInstance } from 'class-transformer';

const transformToStringArray = ({ value }: { value: any }): string[] => {
  // Handle null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (Array.isArray(value)) {
    return value.filter((item) => item !== null && item !== undefined && item !== '');
  }

  return [value];
};

const transformToFloatNumber = ({ value }: { value: any }) => parseFloat(value as string);

const transformToJSON = ({ value }: { value: any }): any => {
  return typeof value === 'string' ? JSON.parse(value) : value;
};

const transformToDate = ({ value }: { value: any }) => (value ? new Date(value) : undefined);

/**
 * Transform data to DTO using class-transformer
 * @param dtoClass - Target DTO class
 * @param data - Source data (single object or array)
 * @returns Transformed DTO instance(s)
 */
const transformDataToDto = <T, K>(dtoClass: ClassConstructor<T>, data: K | K[]): T | T[] => {
  return plainToInstance(dtoClass, data);
};
export {
  transformToStringArray,
  transformToFloatNumber,
  transformToJSON,
  transformToDate,
  transformDataToDto,
};
