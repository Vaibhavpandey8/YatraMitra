import React, { useState, useEffect } from "react";
import SignupForm from "./SignupForm";
import { Redirect } from "react-router-dom";
import Swal from "sweetalert2";
import { signUp, verifySignupOtp, resendSignupOtp, isAuthenticated } from "../../../Utils/Requests/Auth";

const Signup = () => {
  const [state, setState] = useState({
    name: "",
    email: "",
    phone: "",
    citizenshipNumber: "",
    password: "",
    otp: "",
    otpSent: false,
    error: "",
    loading: false,
    success: false
  });
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const { name, email, phone, citizenshipNumber, password, otp, otpSent, loading, error, success } = state;

  const handleChange = event => {
    setState({
      ...state,
      error: false,
      [event.target.name]: event.target.value
    });
  };

  // Step 1 — Submit registration details → Backend sends OTP to Gmail
  const handleSubmit = async event => {
    event.preventDefault();
    setState({ ...state, error: false, loading: true });

    const resp = await signUp({ name, email, phone, citizenshipNumber, password }).catch(err => {
      setState({
        ...state,
        loading: false,
        error:
          err.response && err.response.data && err.response.data.error
            ? err.response.data.error
            : "Something went wrong!"
      });
    });

    if (resp && resp.status === 200 && resp.data.otpSent) {
      setState({
        ...state,
        loading: false,
        otpSent: true,
        error: ""
      });
    }
  };

  // Step 2 — Submit OTP → Account is created
  const handleOtpSubmit = async event => {
    event.preventDefault();
    setState({ ...state, error: false, loading: true });

    const resp = await verifySignupOtp({ email, otp }).catch(err => {
      setState({
        ...state,
        loading: false,
        error:
          err.response && err.response.data && err.response.data.error
            ? err.response.data.error
            : "Invalid or expired OTP. Please try again."
      });
    });

    if (resp && resp.status === 200 && resp.data.success) {
      Swal.fire({
        type: "success",
        title: "Email Verified! 🎉",
        text: "Your account has been created successfully. You can now sign in.",
        confirmButtonColor: "#00BCD4"
      }).then(() => {
        setState({ ...state, loading: false, success: true });
      });
    }
  };

  // Step 3 — Resend OTP with 30s cooldown
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setState({ ...state, error: false, loading: true });
    const resp = await resendSignupOtp({ email }).catch(err => {
      setState({
        ...state,
        loading: false,
        error:
          err.response && err.response.data && err.response.data.error
            ? err.response.data.error
            : "Failed to resend OTP."
      });
    });
    if (resp && resp.status === 200) {
      setState({ ...state, loading: false, error: "", otp: "" });
      setResendCooldown(30);
    }
  };

  const showError = () => (
    <div className="alert alert-danger" style={{ position: "relative", zIndex: 10 }}>
      {error}
    </div>
  );

  const showLoading = () => (
    <div className="alert alert-info" style={{ position: "relative", zIndex: 10 }}>
      <h2>Loading...</h2>
    </div>
  );

  if (success) {
    return <Redirect to="/signin" />;
  }

  if (isAuthenticated()) {
    return <Redirect to="/" />;
  }

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

        {/* Centered Login Card Wrapper */}
        <div className="login-content-wrap">
          <div style={{ width: "100%", maxWidth: "440px", margin: "0 auto 1.5rem", position: "relative", zIndex: 10 }}>
            {loading && showLoading()}
            {error && showError()}
          </div>
          {!loading && (
            <SignupForm
              handleSubmit={handleSubmit}
              handleOtpSubmit={handleOtpSubmit}
              handleResend={handleResend}
              handleChange={handleChange}
              resendCooldown={resendCooldown}
              state={state}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
