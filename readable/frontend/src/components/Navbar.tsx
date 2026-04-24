import { Link, NavLink, useNavigate } from "react-router-dom";

import { authStore } from "../stores/authStore";

const baseLink =
  "rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/70 hover:text-sea";

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
    <nav className="sticky top-0 z-20 border-b border-white/60 bg-blush/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="text-xl font-semibold tracking-tight text-ink">
          Readable
        </Link>
        <div className="flex items-center gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${baseLink} ${isActive ? "bg-white text-sea shadow-soft" : "text-slate-600"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <span className="hidden rounded-full bg-white px-4 py-2 text-sm text-slate-600 sm:inline-flex">
            {user?.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
};
