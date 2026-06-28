import { Link, NavLink, useNavigate } from "react-router-dom";
import { authStore } from "../stores/authStore";
import { Activity, BookOpen, Compass, LogOut, UploadCloud, User } from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Compass;
};

export const Navbar = () => {
  const navigate = useNavigate();
  const { role, user, logout } = authStore();

  let links: NavItem[] = [];
  if (role === "teacher") {
    links = [
      { to: "/dashboard", label: "Dashboard", icon: Compass },
      { to: "/upload", label: "Lessons", icon: UploadCloud },
    ];
  } else if (role === "student") {
    links = [
      { to: "/dashboard", label: "Home", icon: Compass },
      { to: "/progress", label: "Stats", icon: Activity },
      { to: "/diagnostic", label: "Quest", icon: BookOpen },
    ];
  }
  // Parent has no nav links, so it remains empty.

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/70 bg-white/78 py-3 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link to="/dashboard" className="flex items-center gap-4 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-teal-400 to-orange-400 text-xl font-black text-white shadow-lg shadow-sky-500/20 transition-transform group-hover:-translate-y-0.5">
            R
          </div>
          <div>
            <span className="block text-2xl font-black tracking-tight text-slate-950">Readable</span>
            <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-teal-600">
              Explorer Hub
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {links.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 mr-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-5 py-2.5 text-sm font-black uppercase tracking-widest transition-all rounded-xl ${
                      isActive
                        ? "bg-white text-sky-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/70"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              )})}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <User className="w-4 h-4" />
              </div>
              <span className="hidden text-sm font-bold text-slate-700 lg:block">
                {user?.email}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="btn-3d flex h-12 w-12 items-center justify-center rounded-2xl border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Log out"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
