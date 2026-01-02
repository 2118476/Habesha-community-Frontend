import { useInfiniteQuery } from "@tanstack/react-query";
import api from "../api/axiosInstance";

/**
 * Infinite activity feed using /api/activity?limit=&before=
 * before = ISO createdAt of the last item from the previous page.
 */
export default function useInfiniteActivity(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ["activity", pageSize],
    queryFn: async ({ pageParam }) => {
      const params = { limit: pageSize };
      if (pageParam) params.before = pageParam; // ISO or epoch millis accepted by backend
      const res = await api.get("/api/activity", { params });
      const items = Array.isArray(res.data) ? res.data : [];
      return {
        items,
        nextCursor: items.length ? items[items.length - 1].createdAt : undefined,
      };
    },
    getNextPageParam: (last) => last?.nextCursor,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
