import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { DEFAULT_STALE_TIME } from '@/constants/query';

interface ProvidersProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: DEFAULT_STALE_TIME,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
