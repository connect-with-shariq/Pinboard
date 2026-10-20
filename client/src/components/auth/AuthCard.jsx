import { Link } from "react-router-dom";

// The pinned paper card used by the login and register pages
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <Link to="/" className="auth-page__back">← Back to home</Link>
      <div className="auth-card">
        <span className="auth-card__pin" aria-hidden="true" />
        <Link to="/" className="auth-card__brand">📌 Pinboard</Link>
        <h1 className="auth-card__title">{title}</h1>
        {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
        {children}
        {footer && <div className="auth-card__footer">{footer}</div>}
      </div>
    </div>
  );
}
