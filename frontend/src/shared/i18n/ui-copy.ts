import type { ReservationStatus } from "../../features/reservations/schemas/reservation";
import type {
  DeviceDesiredPublishStatus
} from "../../features/admin_dashboard/schemas/device";
import type {
  AlertStatus,
  AlertType
} from "../../features/admin_dashboard/schemas/alert";

export const uiTerms = {
  appSubtitle: "Consola de operaciones",
  nav: {
    spaces: "Oficinas",
    reservations: "Reservas",
    admin: "Admin",
    help: "Ayuda"
  },
  nouns: {
    place: "lugar",
    placePlural: "lugares",
    space: "oficina",
    spacePlural: "oficinas",
    reservation: "reserva",
    reservationPlural: "reservas",
    dashboard: "dashboard"
  },
  actions: {
    createReservation: "Crear reserva",
    newReservation: "Nueva reserva",
    cancel: "Cancelar",
    cancelReservation: "Cancelar reserva",
    delete: "Eliminar",
    deleteReservation: "Eliminar reserva",
    confirmCancel: "Confirmar cancelación",
    confirmDelete: "Confirmar eliminación",
    keepReservation: "Conservar reserva",
    keepRecord: "Conservar registro",
    retry: "Reintentar",
    reset: "Restablecer",
    clearFilters: "Limpiar filtros",
    viewDetails: "Ver detalles",
    openDashboard: "Abrir dashboard",
    openSwagger: "Abrir Swagger",
    publishUpdate: "Publicar actualización",
    publishing: "Publicando…",
    closeModal: "Cerrar modal",
    previous: "Anterior",
    next: "Siguiente",
    open: "Abrir"
  },
  a11y: {
    goHome: "Ir al inicio",
    primaryNavigation: "Navegación principal",
    help: "Ayuda",
    reservationsPagination: "Paginación de reservas",
    loadingSpaces: "Cargando oficinas",
    loadingSpace: "Cargando oficina",
    loadingReservation: "Cargando reserva",
    loadingMonitoring: "Cargando monitoreo"
  }
} as const;

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  ACTIVE: "Activa",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada"
};

export const devicePublishStatusLabels: Record<DeviceDesiredPublishStatus, string> = {
  PENDING: "Pendiente",
  PUBLISHED: "Publicado",
  FAILED: "Fallido"
};

export const alertTypeLabels: Record<AlertType, string> = {
  CO2: "CO₂",
  OCCUPANCY_MAX: "Ocupación máxima",
  OCCUPANCY_UNEXPECTED: "Ocupación inesperada"
};

export const alertStatusLabels: Record<AlertStatus, string> = {
  OPEN: "Abierta",
  RESOLVED: "Resuelta"
};

export const iotConnectionLabel = (
  status: "idle" | "connecting" | "open" | "closed" | "error"
): string => {
  if (status === "open") return "IoT conectado";
  if (status === "connecting" || status === "idle") return "IoT conectando";
  return "IoT sin conexión";
};

export const pluralizeSpanish = (
  count: number,
  singular: string,
  plural: string
): string => `${count} ${count === 1 ? singular : plural}`;

export const formatActiveAlertsLabel = (count: number): string =>
  `${count} ${count === 1 ? "alerta activa" : "alertas activas"}`;
