import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFlagsClient } from '@repo/api-client';
import type { CreateFlagRequest } from '@repo/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const flagsClient = createFlagsClient(API_URL);

export const useCreateFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFlagRequest) => flagsClient.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
    },
  });
};
