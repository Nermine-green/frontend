import { useState } from "react";
import styles from "./forgot-password.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setMessage("If this email exists, a reset link has been sent.");
    } else {
      setMessage("Error sending reset email.");
    }
  }

  return (
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          required
          onChange={e => setEmail(e.target.value)}
          className="forgot-password-input"
        />
        <button type="submit" className="forgot-password-button">Send Reset Link</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
