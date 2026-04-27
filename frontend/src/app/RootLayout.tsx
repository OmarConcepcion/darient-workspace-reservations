import { NavLink, Outlet } from "react-router-dom";

import { ActivityIcon, BuildingIcon, CalendarIcon, cn, SparklesIcon } from "../shared/ui";

const navItems = [
  { to: "/spaces", label: "Spaces", icon: <BuildingIcon size={14} /> },
  { to: "/reservations", label: "Reservations", icon: <CalendarIcon size={14} /> },
  { to: "/admin", label: "Admin", icon: <ActivityIcon size={14} /> }
];

export const RootLayout = () => (
  <div className="min-h-screen bg-slate-50/40 text-slate-800">
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/90 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-0 px-4 py-0 sm:px-6">
        <NavLink
          to="/"
          aria-label="Go to home"
          className="group flex items-center gap-2.5 py-3 pr-4"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-700/30 ring-1 ring-brand-700/20 transition group-hover:scale-105">
            <SparklesIcon size={15} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-slate-900">
              Darient Workspaces
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Reservations
            </p>
          </div>
        </NavLink>

        <div aria-hidden="true" className="h-5 w-px bg-slate-200 mx-1" />

        <nav aria-label="Primary" className="flex items-center text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-1.5 px-3.5 py-3 font-medium transition",
                  isActive
                    ? "text-brand-700"
                    : "text-slate-500 hover:text-slate-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn("transition", isActive ? "text-brand-600" : "text-slate-400")}>
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2 pl-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <Outlet />
    </main>
  </div>
);
