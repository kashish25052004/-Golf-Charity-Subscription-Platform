import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">Golf</span>
          <span>
            <strong>Play</strong>
            <small>& donate</small>
          </span>
        </Link>

        <nav className="nav">
          <NavLink to="/">Home</NavLink>
          {!user && <NavLink to="/login">Login</NavLink>}
          {!user && <NavLink to="/register">Join</NavLink>}
          {user?.role === "subscriber" && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          {user && (
            <button type="button" className="ghost-btn" onClick={logout}>
              Logout
            </button>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

