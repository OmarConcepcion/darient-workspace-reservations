import { type RouteObject } from "react-router-dom";

import {
  AdminOverviewView,
  SpaceMonitoringView
} from "../features/admin_dashboard";
import {
  NewReservationView,
  ReservationsListView
} from "../features/reservations";
import { SpaceDetailView, SpacesListView } from "../features/spaces";
import { HomePage } from "./pages/HomePage";
import { RootLayout } from "./RootLayout";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "spaces", element: <SpacesListView /> },
      { path: "spaces/:space_id", element: <SpaceDetailView /> },
      { path: "reservations", element: <ReservationsListView /> },
      { path: "reservations/new", element: <NewReservationView /> },
      { path: "admin", element: <AdminOverviewView /> },
      { path: "admin/spaces/:space_id", element: <SpaceMonitoringView /> }
    ]
  }
];
