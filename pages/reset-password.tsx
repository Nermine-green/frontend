import { useState } from "react";
import { useRouter } from "next/router";
import styles from "./reset-password.module.css";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      setMessage("Password reset successful. You can now log in.");
    } else {
      setMessage("Error resetting password. The link may be invalid or expired.");
    }
  }

  return (
    <div className="reset-password-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          required
          onChange={e => setPassword(e.target.value)}
          className="reset-password-input"
        />
        <button type="submit" className="reset-password-button">Reset Password</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
