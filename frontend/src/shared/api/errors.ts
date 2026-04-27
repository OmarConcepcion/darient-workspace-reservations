export type ApiError = {
  code: string;
  message: string;
  details: Record<string, unknown>;
};

const fallbackError: ApiError = {
  code: "UNKNOWN_ERROR",
  message: "Unexpected error.",
  details: {}
};

export const normalizeApiError = (error: unknown): ApiError => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data;

    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "object" &&
      data.error !== null &&
      "code" in data.error &&
      "message" in data.error
    ) {
      return {
        code: String(data.error.code),
        message: String(data.error.message),
        details:
          "details" in data.error &&
          typeof data.error.details === "object" &&
          data.error.details !== null
            ? (data.error.details as Record<string, unknown>)
            : {}
      };
    }
  }

  return fallbackError;
};
