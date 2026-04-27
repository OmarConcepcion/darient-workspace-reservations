import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";

type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  router?: MemoryRouterProps;
  queryClient?: QueryClient;
};

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false }
    }
  });

export const renderWithProviders = (
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
) => {
  const { router, queryClient = createTestQueryClient(), ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter {...router}>{children}</MemoryRouter>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient
  };
};

export const TEST_API_BASE_URL = "http://localhost:3000/api/v1";
