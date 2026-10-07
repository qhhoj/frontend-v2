import { QueryClient } from '@tanstack/vue-query';
import { ApiError } from './client';

/** 4xx answers are final; a server or network error gets one more try. */
export const shouldRetry = (failureCount: number, error: unknown) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 1;

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
      mutations: { retry: false },
    },
  });
