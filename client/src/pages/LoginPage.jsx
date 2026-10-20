import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthCard from "../components/auth/AuthCard";
import FormField from "../components/auth/FormField";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.login, form.password); // GuestRoute redirects after this
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to see your board."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <FormField label="Username or email" name="login" value={form.login} onChange={onChange} autoComplete="username" autoFocus required />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={onChange} autoComplete="current-password" required />
        {error && <div className="alert alert--error">{error}</div>}
        <button className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthCard>
  );
}
