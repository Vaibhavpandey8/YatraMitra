import React, { useState, useEffect } from "react";
import { Link, Redirect } from "react-router-dom";
import Swal from "sweetalert2";
import {
  forgotPassword,
  verifyForgotOtp,
  resetPassword
} from "../../../Utils/Requests/Auth";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [state, setState] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
    error: "",
    loading: false
  });
  const [resendCooldown, setResendCooldown] = useState(0);
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = e => {
    setState({ ...state, error: "", [e.target.name]: e.target.value });
  };

  // Step 1 — Send OTP
  const handleEmailSubmit = async e => {
    e.preventDefault();
    setState({ ...state, error: "", loading: true });
    const resp = await forgotPassword({ email: state.email }).catch(err => {
      setState({
        ...state,
        loading: false,
        error: err.response?.data?.error || "Something went wrong."
      });
    });
    if (resp && resp.status === 200) {
      setState({ ...state, loading: false, error: "" });
      setStep(2);
      setResendCooldown(30);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setState({ ...state, error: "", loading: true });
    const resp = await forgotPassword({ email: state.email }).catch(err => {
      setState({ ...state, loading: false, error: err.response?.data?.error || "Failed to resend." });
    });
    if (resp && resp.status === 200) {
      setState({ ...state, loading: false, error: "", otp: "" });
      setResendCooldown(30);
    }
  };

  // Step 2 — Verify OTP
  const handleOtpSubmit = async e => {
    e.preventDefault();
    setState({ ...state, error: "", loading: true });
    const resp = await verifyForgotOtp({ email: state.email, otp: state.otp }).catch(err => {
      setState({
        ...state,
        loading: false,
        error: err.response?.data?.error || "Invalid OTP."
      });
    });
    if (resp && resp.status === 200) {
      setState({ ...state, loading: false, error: "" });
      setStep(3);
    }
  };

  // Step 3 — Reset password
  const handleResetSubmit = async e => {
    e.preventDefault();
    if (state.newPassword !== state.confirmPassword) {
      return setState({ ...state, error: "Passwords do not match." });
    }
    if (state.newPassword.length < 6) {
      return setState({ ...state, error: "Password must be at least 6 characters." });
    }
    setState({ ...state, error: "", loading: true });
    const resp = await resetPassword({ email: state.email, newPassword: state.newPassword }).catch(err => {
      setState({ ...state, loading: false, error: err.response?.data?.error || "Failed to reset password." });
    });
    if (resp && resp.status === 200) {
      Swal.fire({
        type: "success",
        title: "Password Reset! 🎉",
        text: "Your password has been changed. Please sign in with your new password.",
        confirmButtonColor: "#f59e0b"
      }).then(() => setDone(true));
    }
  };

  if (done) return <Redirect to="/signin" />;

  const stepIcons = ["✉️", "🔑", "🔒"];
  const stepLabels = ["Enter Email", "Verify OTP", "New Password"];

  return (
    <div className="login-dark">
      {/* Full Page Video Background */}
      <video
        className="video-bg"
        src="/assets/journey.mp4"
        autoPlay
        loop
        playsInline
        muted
        ref={(el) => { if (el) el.muted = true; }}
      />
      <div className="login-video-overlay-full" />

      {/* Main Responsive Flex Layout Container */}
      <div className="login-container-inner">
        {/* Branding Text */}
        <div className="branding-text">
          <h1>Every journey begins here</h1>
          <div className="amber-line" />
        </div>

        {/* Centered Form Card Wrapper */}
        <div className="login-content-wrap">
          {/* Notifications display */}
          <div style={{ width: "100%", maxWidth: "380px", margin: "0 auto 1rem", position: "relative", zIndex: 10 }}>
            {state.error && (
              <div className="alert alert-danger" style={{ backdropFilter: "blur(8px)" }}>
                {state.error}
              </div>
            )}
            {state.loading && (
              <div className="alert alert-info" style={{ backdropFilter: "blur(8px)" }}>
                Sending...
              </div>
            )}
          </div>

        <form
          className="login-form"
          onSubmit={step === 1 ? handleEmailSubmit : step === 2 ? handleOtpSubmit : handleResetSubmit}
        >
          {/* Pill Badge */}
          <div className="admin-badge">Recover</div>

          {/* Logo */}
          <div className="login-logo">
            <div className="logo-icon-wrapper" style={{ background: step === 2 ? "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)" : undefined, boxShadow: step === 2 ? "0 8px 24px rgba(56, 189, 248, 0.25)" : undefined }}>
              {stepIcons[step - 1]}
            </div>
            <h2>YatraMitra</h2>
            <p>Reset Your Password</p>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "1.8rem" }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                display: "flex", alignItems: "center", gap: "6px",
                opacity: step >= s ? 1 : 0.35
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: step > s ? "#22c55e" : step === s ? "#f59e0b" : "#334155",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: "bold", transition: "all 0.3s"
                }}>
                  {step > s ? "✓" : s}
                </div>
                <span style={{ fontSize: "0.7rem", color: step === s ? "#f59e0b" : "#94a3b8", fontWeight: step === s ? "700" : "normal" }}>
                  {stepLabels[s - 1]}
                </span>
                {s < 3 && <div style={{ width: 15, height: 1, background: step > s ? "#22c55e" : "#334155" }} />}
              </div>
            ))}
          </div>

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <>
              <p style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "0.82rem", marginBottom: "1.2rem", textAlign: "center" }}>
                Enter your registered email and we'll send you an OTP to reset your password.
              </p>
              <div className="form-group">
                <label className="input-label">Email Address</label>
                <div className="custom-input-wrapper">
                  <i className="fa fa-envelope input-icon-left" />
                  <div className="input-inner-box">
                    <input
                      type="email"
                      placeholder="Enter your registered email"
                      name="email"
                      value={state.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
              <button className="btn-submit" type="submit" style={{ marginTop: "1.2rem" }}>
                <i className="fa fa-paper-plane" />
                Send OTP to Gmail
              </button>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <>
              <div style={{
                background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", padding: "1rem",
                borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.82rem", textAlign: "center",
                border: "1px solid rgba(56, 189, 248, 0.2)"
              }}>
                A 6-digit OTP has been sent to <b>{state.email}</b>.
              </div>
              <div className="form-group">
                <label className="input-label">Enter OTP Code</label>
                <div className="custom-input-wrapper" style={{ borderColor: "rgba(56, 189, 248, 0.25)" }}>
                  <i className="fa fa-key input-icon-left" style={{ color: "#38bdf8" }} />
                  <div className="input-inner-box">
                    <input
                      type="text"
                      placeholder="6-digit code"
                      name="otp"
                      value={state.otp}
                      onChange={handleChange}
                      required
                      maxLength={6}
                      style={{
                        letterSpacing: "0.25em",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                        textAlign: "center"
                      }}
                    />
                  </div>
                </div>
              </div>
              <button className="btn-submit" type="submit" style={{ background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)", boxShadow: "0 4px 15px rgba(56, 189, 248, 0.25)", marginTop: "1.2rem" }}>
                <i className="fa fa-check-circle" />
                Verify OTP
              </button>
              {/* Resend */}
              <div style={{ textAlign: "center", marginTop: "1.2rem" }}>
                {resendCooldown > 0 ? (
                  <p style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.82rem" }}>
                    Resend in <b style={{ color: "#38bdf8" }}>{resendCooldown}s</b>
                  </p>
                ) : (
                  <p style={{ fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.4)" }}>
                    Didn't receive it?{" "}
                    <a href="#" onClick={e => { e.preventDefault(); handleResend(); }} style={{ color: "#38bdf8", fontWeight: "bold", textDecoration: "none" }}>
                      Resend OTP
                    </a>
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 3 && (
            <>
              <p style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "0.82rem", marginBottom: "1.2rem", textAlign: "center" }}>
                OTP verified! Enter your new password below.
              </p>
              <div className="form-group">
                <label className="input-label">New Password</label>
                <div className="custom-input-wrapper">
                  <i className="fa fa-lock input-icon-left" />
                  <div className="input-inner-box">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Enter new password"
                      name="newPassword"
                      value={state.newPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="input-label">Confirm Password</label>
                <div className="custom-input-wrapper">
                  <i className="fa fa-lock input-icon-left" />
                  <div className="input-inner-box">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Confirm new password"
                      name="confirmPassword"
                      value={state.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="options-row">
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={showPass}
                    onChange={() => setShowPass(p => !p)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">Show passwords</span>
                </label>
              </div>
              <button className="btn-submit" type="submit">
                <i className="fa fa-save" />
                Reset Password
              </button>
            </>
          )}

          {/* Back to signin */}
          <p className="signup-prompt">
            Remember your password? <Link to="/signin">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  </div>
);
};

export default ForgotPassword;
