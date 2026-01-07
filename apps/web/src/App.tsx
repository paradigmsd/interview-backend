import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FlagDashboard } from './pages/FlagDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FlagDashboard />
    </QueryClientProvider>
  );
}
