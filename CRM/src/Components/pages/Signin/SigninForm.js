import React, { useState } from "react";
import { Link } from "react-router-dom";

function SigninForm({ handleChange, handleSubmit, state }) {
  const [value, setValue] = useState({ hidden: true });

  const toggleShow = () => {
    setValue({ hidden: !value.hidden });
  };

  return (
    <form className="login-form login-card" onSubmit={handleSubmit}>
      {/* Pill Badge */}
      <div className="admin-badge">Admin CRM</div>

      {/* Logo / Brand */}
      <div className="login-logo">
        <div className="logo-icon-wrapper">
          🚌
        </div>
        <h2>YatraMitra</h2>
        <p>Sign in to your dashboard</p>
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
              value={state.email}
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
              value={state.password}
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

      {/* Checkbox and Forgot Password Row */}
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
        <Link to="/forgot-password" className="forgot-link">
          Forgot Password?
        </Link>
      </div>

      {/* Submit */}
      <button className="btn-submit" type="submit">
        <i className="fa fa-sign-in" />
        Log In
      </button>

      {/* Sign up link */}
      <p className="signup-prompt">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </form>
  );
}

export default SigninForm;
