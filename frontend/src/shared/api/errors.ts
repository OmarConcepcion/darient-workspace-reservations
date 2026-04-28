export type ApiError = {
  code: string;
  message: string;
  details: Record<string, unknown>;
};

const translatedMessagesByCode: Record<string, string> = {
  UNKNOWN_ERROR: "Ocurrió un error inesperado.",
  INTERNAL_ERROR: "Ocurrió un error interno.",
  VALIDATION_ERROR: "La solicitud contiene datos inválidos.",
  INVALID_RESERVATION_TIME:
    "La hora de finalización debe ser posterior a la hora de inicio.",
  PLACE_SPACE_MISMATCH:
    "La oficina seleccionada no pertenece al lugar indicado.",
  SPACE_NOT_FOUND: "No se encontró la oficina.",
  PLACE_NOT_FOUND: "No se encontró el lugar.",
  RESERVATION_NOT_FOUND: "No se encontró la reserva.",
  RESERVATION_CONFLICT:
    "La oficina ya está reservada en el horario seleccionado.",
  WEEKLY_RESERVATION_LIMIT_EXCEEDED:
    "Se alcanzó el límite semanal de 3 reservas activas para este correo.",
  RESERVATION_MUST_BE_CANCELLED_BEFORE_DELETE:
    "La reserva debe cancelarse antes de eliminarse.",
  MQTT_PUBLISH_FAILED:
    "No se pudo publicar la configuración del dispositivo.",
  IOT_SPACE_NOT_FOUND: "No se encontró la configuración IoT de la oficina.",
  NOT_FOUND: "No se encontró el recurso solicitado.",
  UNAUTHORIZED: "No autorizado.",
  CONFLICT: "La acción no se pudo completar por un conflicto con el estado actual."
};

const fallbackError: ApiError = {
  code: "UNKNOWN_ERROR",
  message: translatedMessagesByCode.UNKNOWN_ERROR,
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
        message:
          translatedMessagesByCode[String(data.error.code)] ?? String(data.error.message),
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
