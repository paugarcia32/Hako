export type ID = string;

export type Timestamp = {
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
};

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type Result<T, E = ApiError> = { success: true; data: T } | { success: false; error: E };
