import { lazy, Suspense, type ReactNode } from "react";
import { type RouteObject } from "react-router-dom";

import { Skeleton } from "../shared/ui";
import { SpaceDetailView, SpacesListView } from "../features/spaces";
import { HomePage } from "./pages/HomePage";
import { RootLayout } from "./RootLayout";

const ReservationsListView = lazy(() =>
  import("../features/reservations").then((module) => ({
    default: module.ReservationsListView
  }))
);

const NewReservationView = lazy(() =>
  import("../features/reservations").then((module) => ({
    default: module.NewReservationView
  }))
);

const AdminOverviewView = lazy(() =>
  import("../features/admin_dashboard").then((module) => ({
    default: module.AdminOverviewView
  }))
);

const SpaceMonitoringView = lazy(() =>
  import("../features/admin_dashboard").then((module) => ({
    default: module.SpaceMonitoringView
  }))
);

const RouteFallback = () => (
  <div className="space-y-6">
    <Skeleton className="h-12 w-1/3" />
    <Skeleton className="h-64" />
  </div>
);

const withFallback = (node: ReactNode): ReactNode => (
  <Suspense fallback={<RouteFallback />}>{node}</Suspense>
);

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "spaces", element: <SpacesListView /> },
      { path: "spaces/:space_id", element: <SpaceDetailView /> },
      {
        path: "reservations",
        element: withFallback(<ReservationsListView />)
      },
      {
        path: "reservations/new",
        element: withFallback(<NewReservationView />)
      },
      { path: "admin", element: withFallback(<AdminOverviewView />) },
      {
        path: "admin/spaces/:space_id",
        element: withFallback(<SpaceMonitoringView />)
      }
    ]
  }
];
