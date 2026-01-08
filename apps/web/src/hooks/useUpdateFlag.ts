import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFlagsClient } from '@repo/api-client';
import type { UpdateFlagRequest } from '@repo/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const flagsClient = createFlagsClient(API_URL);

export const useUpdateFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlagRequest }) =>
      flagsClient.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
    },
  });
};
