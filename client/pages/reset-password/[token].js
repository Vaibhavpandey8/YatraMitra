import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import { resetPasswordApi } from "../../utils/auth";

const ResetPassword = () => {
  const router = useRouter();
  const { token } = router.query;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      return Swal.fire("Error", "Reset link is invalid or has expired", "error");
    }

    if (newPassword.length < 6) {
      return Swal.fire("Validation Error", "Password must be at least 6 characters long", "warning");
    }

    if (newPassword !== confirmPassword) {
      return Swal.fire("Validation Error", "Passwords do not match", "warning");
    }

    setLoading(true);
    try {
      const res = await resetPasswordApi(token, newPassword);
      if (res && res.error) {
        Swal.fire("Error", res.error, "error");
      } else {
        await Swal.fire("Success!", "Password reset successfully! You can now log in with your new password.", "success");
        router.push("/");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <Head>
        <title>Reset Password - YatraMitra</title>
      </Head>
      <div className="reset-card">
        <div className="reset-header">
          <img src="/static/logo.png" alt="logo" className="reset-logo" />
          <h2 className="reset-title">Reset Password</h2>
          <p className="reset-subtitle">Enter your new secure password below</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label>New Password</label>
            <div className="auth-input-container">
              <span className="auth-input-icon">🔒</span>
              <input
                type="password"
                placeholder="Enter new password"
                className="auth-input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="auth-form-group">
            <label>Confirm Password</label>
            <div className="auth-input-container">
              <span className="auth-input-icon">🔒</span>
              <input
                type="password"
                placeholder="Confirm new password"
                className="auth-input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
