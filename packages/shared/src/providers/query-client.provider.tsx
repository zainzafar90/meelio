import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { PropsWithChildren, useRef } from "react";
import { db } from "../lib/db";

const createIndexedDBPersister = () => ({
  persistClient: async (client: any) => {
    try {
      await db.queryCache.put({
        id: "queryCache",
        client,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error persisting query client:", error);
    }
  },
  restoreClient: async () => {
    try {
      const cache = await db.queryCache.get("queryCache");
      if (!cache) return;
      return cache.client;
    } catch (error) {
      console.error("Error restoring query client:", error);
    }
  },
  removeClient: async () => {
    try {
      await db.queryCache.delete("queryCache");
    } catch (error) {
      console.error("Error removing query client:", error);
    }
  },
});

export const QueryProvider = ({ children }: PropsWithChildren) => {
  const queryClientRef = useRef<QueryClient>();

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: Infinity,
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: (failureCount, error) => {
            if (!navigator.onLine) return false;
            return failureCount < 3;
          },
        },
      },
    });

    // Set up persistence
    persistQueryClient({
      queryClient: queryClientRef.current,
      persister: createIndexedDBPersister(),
    });
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
};
