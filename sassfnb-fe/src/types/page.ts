// src/types/page.ts
export type PageResponse<T> = {
  content: T[];
  number: number; // page index
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
};
