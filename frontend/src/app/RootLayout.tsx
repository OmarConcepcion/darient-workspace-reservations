import { NavLink, Outlet } from "react-router-dom";

import { useEventStream } from "../features/admin_dashboard/hooks/use-event-stream";
import {
  ActivityIcon,
  BuildingIcon,
  CalendarIcon,
  cn,
  HelpCircleIcon,
  SparklesIcon
} from "../shared/ui";

const navItems = [
  { to: "/spaces", label: "Spaces", icon: <BuildingIcon size={14} /> },
  { to: "/reservations", label: "Reservations", icon: <CalendarIcon size={14} /> },
  { to: "/admin", label: "Admin", icon: <ActivityIcon size={14} /> }
];

export const RootLayout = () => {
  const iotStatus = useEventStream({});

  return (
    <div className="min-h-screen overflow-x-hidden text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 shadow-[0_16px_50px_-44px_rgba(15,23,42,0.6)] backdrop-blur-xl">
        <div className="app-container flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:py-0">
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center">
            <NavLink
              to="/"
              aria-label="Go to home"
              className="group flex min-w-0 items-center gap-3 md:py-4"
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 text-white shadow-lg shadow-brand-700/25 ring-1 ring-white/70 transition duration-200 group-hover:-translate-y-0.5">
                <SparklesIcon size={20} />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-base font-semibold tracking-tight text-slate-950">
                  Darient Workspace Reservations
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Operations console
                </p>
              </div>
            </NavLink>

            <nav
              aria-label="Primary"
              className="-mx-1 flex min-w-0 gap-1 overflow-x-auto pb-1 text-sm hide-scrollbar md:mx-0 md:pb-0"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "relative flex min-h-11 flex-shrink-0 items-center gap-2 rounded-2xl px-4 font-semibold transition duration-200 lg:min-h-[4.75rem] lg:rounded-none lg:px-5",
                      isActive
                        ? "bg-brand-50 text-brand-700 lg:bg-transparent"
                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-950 lg:hover:bg-transparent"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "transition",
                          isActive ? "text-brand-600" : "text-slate-500"
                        )}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                      {isActive ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-4 -bottom-px hidden h-1 rounded-t-full bg-gradient-to-r from-brand-500 to-brand-700 lg:block"
                        />
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            <IotConnectionBadge status={iotStatus} />
            <NavLink
              to="/help"
              aria-label="Help"
              className={({ isActive }) =>
                cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border text-slate-500 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                  isActive
                    ? "border-brand-200 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white"
                )
              }
            >
              <HelpCircleIcon size={18} />
            </NavLink>
          </div>
        </div>
      </header>

      <main className="app-container py-8 sm:py-10 lg:py-12">
        <Outlet />
      </main>
    </div>
  );
};

const IotConnectionBadge = ({
  status
}: {
  status: ReturnType<typeof useEventStream>;
}) => {
  const isConnected = status === "open";
  const isConnecting = status === "connecting" || status === "idle";

  return (
    <span
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-xs font-bold uppercase tracking-[0.14em]",
        isConnected
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : isConnecting
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-rose-200 bg-rose-50 text-rose-700"
      )}
      title={`IoT stream status: ${status}`}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isConnected
            ? "animate-pulse bg-emerald-500"
            : isConnecting
              ? "animate-pulse bg-amber-500"
              : "bg-rose-500"
        )}
      />
      {isConnected ? "IoT connected" : isConnecting ? "IoT connecting" : "IoT offline"}
    </span>
  );
};
