import { NavLink, Outlet } from "react-router-dom";

import { cn, SparklesIcon } from "../shared/ui";

const navItems = [
  { to: "/spaces", label: "Spaces" },
  { to: "/reservations", label: "Reservations" },
  { to: "/admin", label: "Admin" }
];

export const RootLayout = () => (
  <div className="min-h-screen text-slate-800">
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <NavLink
          to="/"
          aria-label="Go to home"
          className="group flex items-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-700/30 ring-1 ring-brand-700/20 transition group-hover:scale-105">
            <SparklesIcon size={18} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-slate-900">
              Darient Workspaces
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
              Reservations
            </p>
          </div>
        </NavLink>

        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative rounded-lg px-3 py-2 font-medium transition",
                  isActive
                    ? "text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <Outlet />
    </main>
  </div>
);
