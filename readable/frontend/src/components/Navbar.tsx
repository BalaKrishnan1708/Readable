import { Link, NavLink, useNavigate } from "react-router-dom";

import { authStore } from "../stores/authStore";

const baseLink =
  "rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/80 hover:text-sea";

export const Navbar = () => {
  const navigate = useNavigate();
  const { role, user, logout } = authStore();

  const links =
    role === "teacher"
      ? [
          { to: "/dashboard", label: "Dashboard" },
          { to: "/upload", label: "Upload Lesson" },
        ]
      : [
          { to: "/dashboard", label: "Dashboard" },
          { to: "/diagnostic", label: "Diagnostic" },
        ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-sky-100 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-3 text-ink">
          <span className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] text-base font-bold text-white shadow-soft">
            R
          </span>
          <span>
            <span className="block text-xl font-bold tracking-tight text-ink">Readable</span>
            <span className="block text-xs font-bold uppercase tracking-widest text-sky-500">
              Guided Reading
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${baseLink} ${
                  isActive
                    ? "bg-[#eef6ff] text-sea shadow-sm ring-1 ring-sea/10"
                    : "text-slate-500 hover:text-ink"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <span className="hidden items-center rounded-full border border-sky-100 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-500 shadow-sm backdrop-blur sm:flex">
            {user?.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] px-5 py-2.5 text-sm font-semibold tracking-wide text-white shadow-[0_4px_12px_rgba(47,128,237,0.3)] transition hover:brightness-105 active:scale-[0.98]"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
};
