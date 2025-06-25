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

export { transformToStringArray, transformToFloatNumber, transformToJSON, transformToDate };
