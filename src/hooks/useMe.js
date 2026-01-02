import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosInstance';

export default function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me');
      return data;
    },
    staleTime: 60_000
  });
}
