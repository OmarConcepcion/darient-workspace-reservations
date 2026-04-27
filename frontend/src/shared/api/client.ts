import axios from "axios";

type ApiClientConfig = {
  apiKey: string;
  baseUrl: string;
};

const defaultConfig: ApiClientConfig = {
  apiKey: import.meta.env.VITE_API_KEY ?? "",
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"
};

export const createApiClient = (config: ApiClientConfig = defaultConfig) => {
  const client = axios.create({
    baseURL: config.baseUrl,
    headers: {
      "x-api-key": config.apiKey
    }
  });

  return client;
};

export const apiClient = createApiClient();
