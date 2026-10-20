import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthCard from "../components/auth/AuthCard";
import FormField from "../components/auth/FormField";

function validate({ username, email, password, confirm }) {
  const errors = {};
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) errors.username = "3–20 letters, numbers or _";
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email";
  if (password.length < 6) errors.password = "At least 6 characters";
  if (confirm !== password) errors.confirm = "Passwords don't match";
  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await register({ username: form.username, email: form.email, password: form.password });
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create your board"
      subtitle="Pin notes, photos and videos. Share the best ones."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <FormField label="Username" name="username" value={form.username} onChange={onChange} error={errors.username} autoComplete="username" autoFocus />
        <FormField label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} autoComplete="email" />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={onChange} error={errors.password} autoComplete="new-password" />
        <FormField label="Confirm password" name="confirm" type="password" value={form.confirm} onChange={onChange} error={errors.confirm} autoComplete="new-password" />
        {serverError && <div className="alert alert--error">{serverError}</div>}
        <button className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
