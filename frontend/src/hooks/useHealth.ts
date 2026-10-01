import { useQuery } from '@tanstack/react-query';
import { checkBackendHealth } from '@/services/healthService';
import { HealthStatusState } from '@/types/api';

export function useHealth() {
  const query = useQuery({
    queryKey: ['backend-health'],
    queryFn: checkBackendHealth,
    retry: false,
    refetchInterval: 15000,
    staleTime: 5000,
  });

  let statusState: HealthStatusState = 'checking';

  if (query.isLoading) {
    statusState = 'checking';
  } else if (query.isSuccess && query.data?.status === 'UP') {
    statusState = 'online';
  } else if (query.isError) {
    statusState = 'offline';
  }

  return {
    ...query,
    statusState,
    isOnline: statusState === 'online',
    isOffline: statusState === 'offline',
    isChecking: statusState === 'checking',
  };
}
