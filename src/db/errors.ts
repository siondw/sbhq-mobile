export type DbError =
  | { type: 'NOT_FOUND'; resource: string; id: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'VALIDATION_ERROR'; field: string; message: string }
  | { type: 'AUTH_ERROR'; message: string }
  | { type: 'PERMISSION_ERROR'; message: string }
  | { type: 'UNKNOWN_ERROR'; message: string };

export const notFound = (resource: string, id: string): DbError => ({
  type: 'NOT_FOUND',
  resource,
  id,
});

export const networkError = (message: string): DbError => ({
  type: 'NETWORK_ERROR',
  message,
});

export const validationError = (field: string, message: string): DbError => ({
  type: 'VALIDATION_ERROR',
  field,
  message,
});

export const authError = (message: string): DbError => ({
  type: 'AUTH_ERROR',
  message,
});

export const permissionError = (message: string): DbError => ({
  type: 'PERMISSION_ERROR',
  message,
});

export const unknownError = (message: string): DbError => ({
  type: 'UNKNOWN_ERROR',
  message,
});

export const getErrorMessage = (error: DbError): string => {
  switch (error.type) {
    case 'NOT_FOUND':
      return `${error.resource} with id ${error.id} not found`;
    case 'NETWORK_ERROR':
      return `Network error: ${error.message}`;
    case 'VALIDATION_ERROR':
      return `Validation error on ${error.field}: ${error.message}`;
    case 'AUTH_ERROR':
      return `Authentication error: ${error.message}`;
    case 'PERMISSION_ERROR':
      return `Permission denied: ${error.message}`;
    case 'UNKNOWN_ERROR':
      return `Unknown error: ${error.message}`;
  }
};
