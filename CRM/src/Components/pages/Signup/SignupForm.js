import React, { useState } from "react";
import { Link } from "react-router-dom";

function SignupForm({ handleChange, handleSubmit, handleOtpSubmit, handleResend, resendCooldown, state }) {
  const [value, setValue] = useState({ hidden: true });

  const toggleShow = () => {
    setValue({ hidden: !value.hidden });
  };

  // Step 2 — OTP Verification screen
  if (state.otpSent) {
    return (
      <form className="login-form login-card" onSubmit={handleOtpSubmit}>
        {/* Pill Badge */}
        <div className="admin-badge">Verification</div>

        {/* Logo / Brand */}
        <div className="login-logo">
          <div className="logo-icon-wrapper" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', boxShadow: '0 8px 24px rgba(56, 189, 248, 0.25)' }}>
            📧
          </div>
          <h2>Verify Email</h2>
          <p>Please check your Gmail inbox</p>
        </div>

        <div style={{
          background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '1rem',
          borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center',
          border: '1px solid rgba(56, 189, 248, 0.2)'
        }}>
          A 6-digit OTP has been sent to <b>{state.email}</b>.
        </div>

        {/* OTP Code Input */}
        <div className="form-group">
          <label className="input-label">Enter OTP Code</label>
          <div className="custom-input-wrapper">
            <i className="fa fa-key input-icon-left" style={{ color: '#38bdf8' }} />
            <div className="input-inner-box">
              <input
                type="text"
                placeholder="000000"
                name="otp"
                onChange={handleChange}
                value={state.otp || ""}
                required
                maxLength={6}
                style={{
                  letterSpacing: '0.25em',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              />
            </div>
          </div>
        </div>

        {/* Verify Button */}
        <button className="btn-submit" type="submit" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.25)' }}>
          <i className="fa fa-check-circle" />
          Verify & Create Account
        </button>

        {/* Resend OTP */}
        <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
          {resendCooldown > 0 ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.82rem' }}>
              Resend OTP in <b style={{ color: '#38bdf8' }}>{resendCooldown}s</b>
            </p>
          ) : (
            <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              Didn't receive the code?{' '}
              <a
                href="#"
                onClick={e => { e.preventDefault(); handleResend(); }}
                style={{ color: '#38bdf8', fontWeight: 'bold', textDecoration: 'none' }}
              >
                Resend OTP
              </a>
            </p>
          )}
        </div>

        {/* Go back */}
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.82rem' }}>
          <a
            href="#"
            onClick={e => { e.preventDefault(); window.location.reload(); }}
            style={{ color: 'rgba(255, 255, 255, 0.3)', textDecoration: 'none' }}
          >
            ← Go Back
          </a>
        </p>
      </form>
    );
  }

  // Step 1 — Registration form
  return (
    <form className="login-form login-card" onSubmit={handleSubmit} style={{ maxWidth: '440px' }}>
      {/* Pill Badge */}
      <div className="admin-badge">Register</div>

      {/* Logo / Brand */}
      <div className="login-logo">
        <div className="logo-icon-wrapper">
          🚌
        </div>
        <h2>YatraMitra</h2>
        <p>Register as a Bus Owner</p>
      </div>

      {/* Name */}
      <div className="form-group">
        <label className="input-label">Full Name</label>
        <div className="custom-input-wrapper">
          <i className="fa fa-user input-icon-left" />
          <div className="input-inner-box">
            <input
              type="text"
              placeholder="Enter your full name"
              name="name"
              onChange={handleChange}
              value={state.name || ""}
              required
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="form-group">
        <label className="input-label">Email Address</label>
        <div className="custom-input-wrapper">
          <i className="fa fa-envelope input-icon-left" />
          <div className="input-inner-box">
            <input
              type="email"
              placeholder="Enter your email"
              name="email"
              onChange={handleChange}
              value={state.email || ""}
              required
            />
          </div>
        </div>
      </div>

      {/* Phone */}
      <div className="form-group">
        <label className="input-label">Phone Number</label>
        <div className="custom-input-wrapper">
          <i className="fa fa-phone input-icon-left" />
          <div className="input-inner-box">
            <input
              type="number"
              placeholder="Enter your phone number"
              name="phone"
              onChange={handleChange}
              value={state.phone || ""}
              required
            />
          </div>
        </div>
      </div>

      {/* Citizenship Number */}
      <div className="form-group">
        <label className="input-label">Citizenship / ID Number</label>
        <div className="custom-input-wrapper">
          <i className="fa fa-id-card input-icon-left" />
          <div className="input-inner-box">
            <input
              type="text"
              placeholder="Enter your citizenship/ID number"
              name="citizenshipNumber"
              onChange={handleChange}
              value={state.citizenshipNumber || ""}
              required
            />
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="form-group">
        <label className="input-label">Password</label>
        <div className="custom-input-wrapper">
          <i className="fa fa-lock input-icon-left" />
          <div className="input-inner-box">
            <input
              type={value.hidden ? "password" : "text"}
              placeholder="Enter your password"
              name="password"
              onChange={handleChange}
              value={state.password || ""}
              required
            />
          </div>
          <i 
            className={`fa ${value.hidden ? "fa-eye-slash" : "fa-eye"} input-icon-right`} 
            onClick={toggleShow}
            title={value.hidden ? "Show password" : "Hide password"}
          />
        </div>
      </div>

      {/* Show password checkbox */}
      <div className="options-row">
        <label className="custom-checkbox">
          <input
            type="checkbox"
            checked={!value.hidden}
            onChange={toggleShow}
          />
          <span className="checkmark"></span>
          <span className="checkbox-label">Show password</span>
        </label>
      </div>

      {/* Submit */}
      <button className="btn-submit" type="submit">
        <i className="fa fa-user-plus" />
        Sign Up
      </button>

      {/* Log in link */}
      <p className="signup-prompt">
        Already have an account? <Link to="/signin">Log In</Link>
      </p>
    </form>
  );
}

export default SignupForm;
