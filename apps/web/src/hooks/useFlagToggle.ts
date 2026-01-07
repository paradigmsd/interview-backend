import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFlagsClient } from '@repo/api-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const flagsClient = createFlagsClient(API_URL);

export const useFlagToggle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flagId: string) => flagsClient.toggle(flagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
    },
  });
};
