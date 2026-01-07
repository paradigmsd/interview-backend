import { useQuery } from '@tanstack/react-query';
import { createFlagsClient } from '@repo/api-client';
import type { GetFlagsQuery } from '@repo/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const flagsClient = createFlagsClient(API_URL);

export const useFlags = (query?: GetFlagsQuery) => {
  return useQuery({
    queryKey: ['flags', query],
    queryFn: () => flagsClient.list(query),
    staleTime: 30000,
  });
};
