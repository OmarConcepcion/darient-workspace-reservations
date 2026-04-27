import { Link, Outlet, type RouteObject } from "react-router-dom";

import {
  NewReservationView,
  ReservationsListView
} from "../features/reservations";
import { SpaceDetailView, SpacesListView } from "../features/spaces";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";

const RootLayout = () => (
  <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-base font-semibold">
          Darient Workspace Reservations
        </Link>
        <nav aria-label="Primary" className="flex gap-4 text-sm font-medium">
          <Link to="/spaces">Spaces</Link>
          <Link to="/reservations">Reservations</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Outlet />
    </main>
  </div>
);

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
      { path: "admin", element: <AdminPage /> },
      { path: "admin/spaces/:space_id", element: <AdminPage /> }
    ]
  }
];
