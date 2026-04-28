import { Link, NavLink, useNavigate } from "react-router-dom";
import { authStore } from "../stores/authStore";
import { LogOut, User } from "lucide-react";

export const Navbar = () => {
  const navigate = useNavigate();
  const { role, user, logout } = authStore();

  let links: { to: string; label: string }[] = [];
  if (role === "teacher") {
    links = [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/upload", label: "Lessons" },
      { to: "/gallery", label: "Gallery" },
    ];
  } else if (role === "student") {
    links = [
      { to: "/dashboard", label: "Home" },
      { to: "/progress", label: "Stats" },
      { to: "/diagnostic", label: "Quest" },
      { to: "/gallery", label: "Gallery" },
    ];
  }
  // Parent has no nav links, so it remains empty.

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-4 border-slate-100 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link to="/dashboard" className="flex items-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-2xl font-black text-white border-b-4 border-sky-600 transition-transform group-hover:-translate-y-1">
            R
          </div>
          <div>
            <span className="block text-2xl font-black tracking-tight text-slate-900">Readable</span>
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">
              Explorer Hub
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {links.length > 0 && (
            <div className="hidden md:flex items-center gap-2 mr-4 bg-slate-50 border-2 border-slate-100 rounded-2xl p-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-6 py-2.5 text-sm font-black uppercase tracking-widest transition-all rounded-xl ${
                      isActive
                        ? "bg-white text-sky-600 shadow-sm border-2 border-slate-100"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-2xl">
              <div className="h-8 w-8 rounded-full bg-sky-100 border-2 border-sky-200 flex items-center justify-center">
                <User className="w-4 h-4 text-sky-600" />
              </div>
              <span className="text-sm font-black text-slate-700 hidden lg:block">
                {user?.email}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="btn-3d flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
