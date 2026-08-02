import React, { Component } from "react";
import Swal from "sweetalert2";
import {
  signupUser,
  signinUser,
  socialLoginUser,
  generateOtpApi,
  verifyOtpApi,
  forgotPasswordApi,
  saveAuth,
  getAuthUser,
  removeAuth
} from "../utils/auth";
import { GOOGLE_CLIENT_ID } from "../utils/config";

class AuthModal extends Component {
  state = {
    visible: false,
    mode: "signin", // 'signin' | 'signup' | 'profile' | 'google-mock'
    signinMethod: "password", // 'password' | 'mobile' | 'email'
    name: "",
    email: "",
    password: "",
    phone: "",
    otpCode: "",
    otpSent: false,
    loading: false,
    otpLoading: false,
    onSuccess: null,
    googleEmail: "",
    googleName: "",
    referredByCode: ""
  };

  componentDidMount() {
    window.showAuthModal = (onSuccess, initialMode = "signin") => {
      let referredByCode = "";
      if (initialMode === "signup" && typeof window !== "undefined") {
        referredByCode = localStorage.getItem("referredByCode") || "";
      }
      this.setState({
        visible: true,
        mode: initialMode,
        signinMethod: "password",
        name: "",
        email: "",
        password: "",
        phone: "",
        otpCode: "",
        otpSent: false,
        loading: false,
        otpLoading: false,
        referredByCode,
        onSuccess
      });
    };

    window.showProfileModal = () => {
      this.setState({
        visible: true,
        mode: "profile"
      });
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.visible && !prevState.visible) {
      this.loadGoogleScript();
    }
    if (
      this.state.visible &&
      (this.state.mode !== prevState.mode ||
        this.state.signinMethod !== prevState.signinMethod)
    ) {
      setTimeout(() => this.initializeGoogleSignIn(), 150);
    }
  }

  loadGoogleScript = () => {
    if (typeof window !== "undefined" && !window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.initializeGoogleSignIn();
      };
      document.head.appendChild(script);
    } else {
      this.initializeGoogleSignIn();
    }
  };

  initializeGoogleSignIn = () => {
    if (typeof window !== "undefined" && window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: this.handleCredentialResponse
      });

      const buttonDiv = document.getElementById("google-signin-btn-div");
      if (buttonDiv) {
        const parentWidth = buttonDiv.parentElement ? buttonDiv.parentElement.clientWidth : 280;
        const targetWidth = Math.max(200, Math.min(parentWidth, 280));
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: "outline",
          size: "large",
          width: targetWidth,
          text: "signin_with",
          shape: "rectangular"
        });
      }
    }
  };

  handleCredentialResponse = async (response) => {
    try {
      const token = response.credential;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      
      // Calculate and append base64 padding if necessary
      const pad = base64.length % 4;
      let padding = "";
      if (pad === 2) padding = "==";
      else if (pad === 3) padding = "=";

      const jsonPayload = decodeURIComponent(
        atob(base64 + padding)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const googleUser = JSON.parse(jsonPayload);

      this.setState({ loading: true });
      const refCode = this.state.referredByCode || (typeof window !== "undefined" ? localStorage.getItem("referredByCode") : "") || "";
      const res = await socialLoginUser(
        googleUser.name,
        googleUser.email.toLowerCase().trim(),
        googleUser.picture,
        refCode
      );
      if (res && res.error) {
        Swal.fire("Error", res.error, "error");
      } else if (res && res.token) {
        saveAuth(res.token, res.user);
        Swal.fire(
          "Welcome!",
          `Logged in with Google successfully as ${res.user.name}`,
          "success"
        );
        this.setState({ visible: false });
        if (this.state.onSuccess) this.state.onSuccess();
      }
    } catch (err) {
      console.error("Google authentication error details:", err);
      Swal.fire("Error", "Google authentication failed", "error");
    } finally {
      this.setState({ loading: false });
    }
  };

  handleClose = () => {
    this.setState({ visible: false });
  };

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleTabChange = (mode) => {
    let referredByCode = "";
    if (mode === "signup" && typeof window !== "undefined") {
      referredByCode = localStorage.getItem("referredByCode") || "";
    }
    this.setState({
      mode,
      otpSent: false,
      otpCode: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      referredByCode
    });
  };

  handleSigninMethodChange = (signinMethod) => {
    this.setState({
      signinMethod,
      otpSent: false,
      otpCode: "",
      password: ""
    });
  };

  // MOCK GOOGLE OAUTH FLOW
  handleGoogleLoginClick = () => {
    this.setState({
      mode: "google-mock",
      googleEmail: "",
      googleName: ""
    });
  };

  submitGoogleMock = async (e) => {
    e.preventDefault();
    const { googleEmail, googleName, onSuccess } = this.state;
    if (!googleEmail || !googleName) {
      return Swal.fire("Error", "Please enter name and email to proceed", "error");
    }

    if (!googleEmail.includes("@")) {
      return Swal.fire("Error", "Please enter a valid email address", "error");
    }

    this.setState({ loading: true });
    try {
      const refCode = this.state.referredByCode || (typeof window !== "undefined" ? localStorage.getItem("referredByCode") : "") || "";
      const mockPhoto = "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(googleName);
      const res = await socialLoginUser(googleName, googleEmail.toLowerCase().trim(), mockPhoto, refCode);
      if (res && res.error) {
        Swal.fire("Error", res.error, "error");
      } else if (res && res.token) {
        saveAuth(res.token, res.user);
        Swal.fire("Welcome!", `Signed up with Google successfully as ${res.user.name}`, "success");
        this.setState({ visible: false });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      Swal.fire("Error", "Google Auth simulation failed", "error");
    } finally {
      this.setState({ loading: false });
    }
  };

  useMockGoogleAccount = async (name, email) => {
    const { onSuccess } = this.state;
    this.setState({ loading: true });
    try {
      const refCode = this.state.referredByCode || (typeof window !== "undefined" ? localStorage.getItem("referredByCode") : "") || "";
      const mockPhoto = "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(name);
      const res = await socialLoginUser(name, email, mockPhoto, refCode);
      if (res && res.error) {
        Swal.fire("Error", res.error, "error");
      } else if (res && res.token) {
        saveAuth(res.token, res.user);
        Swal.fire("Welcome!", `Signed in with Google as ${res.user.name}`, "success");
        this.setState({ visible: false });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      Swal.fire("Error", "Google Auth simulation failed", "error");
    } finally {
      this.setState({ loading: false });
    }
  };

  // MANUAL REGISTRATION
  handleSignupSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, phone, referredByCode } = this.state;

    if (!name || !email || !password) {
      return Swal.fire("Validation Error", "Name, Email, and Password are required", "warning");
    }

    this.setState({ loading: true });
    try {
      const res = await signupUser(name, email, password, phone, referredByCode);
      if (res && res.error) {
        Swal.fire("Signup Failed", res.error, "error");
      } else {
        Swal.fire("Success!", "Account registered successfully! Please log in now.", "success");
        this.setState({ mode: "signin", signinMethod: "password" });
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong during signup", "error");
    } finally {
      this.setState({ loading: false });
    }
  };

  // SEND OTP ACTION
  sendOtpCode = async () => {
    const { email } = this.state;

    if (!email) {
      return Swal.fire("Validation Error", "Please enter email to receive OTP", "warning");
    }

    this.setState({ otpLoading: true });
    try {
      const res = await generateOtpApi(email);
      if (res && res.error) {
        Swal.fire("Failed to send OTP", res.error, "error");
      } else {
        this.setState({ otpSent: true });
        Swal.fire(
          "OTP Sent!",
          "Code has been sent",
          "success"
        );
      }
    } catch (err) {
      Swal.fire("Error", "Failed to generate verification OTP", "error");
    } finally {
      this.setState({ otpLoading: false });
    }
  };

  // VERIFY OTP ACTION & LOGIN
  verifyOtpAndLogin = async (e) => {
    e.preventDefault();
    const { email, otpCode, onSuccess } = this.state;

    if (!otpCode) {
      return Swal.fire("Validation Error", "Please enter the 6-digit code", "warning");
    }

    this.setState({ loading: true });
    try {
      const res = await verifyOtpApi(email, otpCode);
      if (res && res.error) {
        Swal.fire("Verification Failed", res.error, "error");
      } else if (res && res.token) {
        saveAuth(res.token, res.user);
        Swal.fire("Login Success!", `Logged in as ${res.user.name}`, "success");
        this.setState({ visible: false });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      Swal.fire("Error", "Authentication failed", "error");
    } finally {
      this.setState({ loading: false });
    }
  };

  // PASSWORD SIGN IN
  handlePasswordSignin = async (e) => {
    e.preventDefault();
    const { email, password, onSuccess } = this.state;

    if (!email || !password) {
      return Swal.fire("Validation Error", "Email and Password are required", "warning");
    }

    this.setState({ loading: true });
    try {
      const res = await signinUser(email, password);
      if (res && res.error) {
        Swal.fire("Error", res.error, "error");
      } else if (res && res.token) {
        saveAuth(res.token, { name: email.split("@")[0], email }); // Server returns token, retrieve detail
        Swal.fire("Welcome Back!", "Logged in successfully", "success");
        this.setState({ visible: false });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      Swal.fire("Error", "Authentication request failed", "error");
    } finally {
      this.setState({ loading: false });
    }
  };

  handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    const { email } = this.state;
    if (!email) {
      return Swal.fire("Validation Error", "Please enter your email address", "warning");
    }

    this.setState({ loading: true });
    try {
      const res = await forgotPasswordApi(email);
      if (res && res.error) {
        Swal.fire("Error", res.error, "error");
      } else {
        Swal.fire(
          "Email Sent!",
          res.message || "Password reset instructions have been sent to your email.",
          "success"
        );
        this.setState({ mode: "signin" });
      }
    } catch (err) {
      Swal.fire("Error", "Failed to request password reset", "error");
    } finally {
      this.setState({ loading: false });
    }
  };

  // PROFILE LOG OUT
  handleLogout = () => {
    removeAuth();
    Swal.fire("Signed Out", "You have been logged out", "success");
    this.setState({ visible: false });
    window.location.reload();
  };

  renderSignInForm = () => {
    const { signinMethod, email, password, phone, otpCode, otpSent, loading, otpLoading } = this.state;

    return (
      <div className="auth-body">
        <div className="auth-sub-tabs">
          <button
            type="button"
            className={`auth-sub-tab ${signinMethod === "password" ? "active" : ""}`}
            onClick={() => this.handleSigninMethodChange("password")}
          >
            Password
          </button>
          <button
            type="button"
            className={`auth-sub-tab ${signinMethod === "email" ? "active" : ""}`}
            onClick={() => this.handleSigninMethodChange("email")}
          >
            Email OTP
          </button>
        </div>

        {signinMethod === "password" && (
          <form onSubmit={this.handlePasswordSignin}>
            <div className="auth-form-group">
              <label>Email Address</label>
              <div className="auth-input-container">
                <span className="auth-input-icon">📧</span>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  className="auth-input-field"
                  value={email}
                  onChange={this.handleChange}
                  required
                />
              </div>
            </div>
            <div className="auth-form-group">
              <label>Password</label>
              <div className="auth-input-container">
                <span className="auth-input-icon">🔒</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  className="auth-input-field"
                  value={password}
                  onChange={this.handleChange}
                  required
                />
              </div>
              <div style={{ textAlign: "right", marginTop: "0.4rem" }}>
                <button
                  type="button"
                  style={{ background: "transparent", border: "none", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.78rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                  onClick={() => this.setState({ mode: "forgot-password" })}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        )}

        {signinMethod === "email" && (
          <form onSubmit={this.verifyOtpAndLogin}>
            <div className="auth-form-group">
              <label>Email Address</label>
              <div className="auth-input-container" style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <span className="auth-input-icon">📧</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    className="auth-input-field"
                    value={email}
                    onChange={this.handleChange}
                    disabled={otpSent}
                    required
                  />
                </div>
                {!otpSent && (
                  <button
                    type="button"
                    className="auth-submit-btn"
                    style={{ margin: 0, width: "auto", padding: "0 1rem" }}
                    onClick={this.sendOtpCode}
                    disabled={otpLoading}
                  >
                    {otpLoading ? "..." : "Send"}
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <div className="auth-form-group" style={{ animation: "fadeIn 0.3s" }}>
                <label>Enter 6-Digit OTP</label>
                <div className="auth-input-container">
                  <span className="auth-input-icon">🔑</span>
                  <input
                    type="text"
                    name="otpCode"
                    placeholder="Enter OTP"
                    className="auth-input-field"
                    value={otpCode}
                    onChange={this.handleChange}
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            )}

            {otpSent && (
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
            )}
          </form>
        )}

        <div className="auth-divider">OR</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div id="google-signin-btn-div"></div>
          <button 
            type="button" 
            style={{ background: "transparent", border: "none", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", marginTop: "0.4rem" }}
            onClick={this.handleGoogleLoginClick}
          >
            Having trouble? Use simulated OAuth
          </button>
        </div>
      </div>
    );
  };

  renderSignUpForm = () => {
    const { name, email, password, phone, referredByCode, loading } = this.state;

    return (
      <form onSubmit={this.handleSignupSubmit} className="auth-body">
        <div className="auth-form-group">
          <label>Full Name *</label>
          <div className="auth-input-container">
            <span className="auth-input-icon">👤</span>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              className="auth-input-field"
              value={name}
              onChange={this.handleChange}
              required
            />
          </div>
        </div>
        <div className="auth-form-group">
          <label>Email Address *</label>
          <div className="auth-input-container">
            <span className="auth-input-icon">📧</span>
            <input
              type="email"
              name="email"
              placeholder="Enter email address"
              className="auth-input-field"
              value={email}
              onChange={this.handleChange}
              required
            />
          </div>
        </div>
        <div className="auth-form-group">
          <label>Mobile Number (Optional)</label>
          <div className="auth-input-container">
            <span className="auth-input-icon">📱</span>
            <input
              type="number"
              name="phone"
              placeholder="Enter 10-digit mobile"
              className="auth-input-field"
              value={phone}
              onChange={this.handleChange}
            />
          </div>
        </div>
        <div className="auth-form-group">
          <label>Password * (Min 6 characters, contains a number)</label>
          <div className="auth-input-container">
            <span className="auth-input-icon">🔒</span>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              className="auth-input-field"
              value={password}
              onChange={this.handleChange}
              required
            />
          </div>
        </div>
        <div className="auth-form-group">
          <label>Referral Code (Optional)</label>
          <div className="auth-input-container">
            <span className="auth-input-icon">🎟️</span>
            <input
              type="text"
              name="referredByCode"
              placeholder="e.g. YMXXXX"
              className="auth-input-field"
              value={referredByCode}
              onChange={this.handleChange}
            />
          </div>
        </div>
        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? "Registering..." : "Create Account"}
        </button>

        <div className="auth-divider">OR</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div id="google-signin-btn-div"></div>
          <button 
            type="button" 
            style={{ background: "transparent", border: "none", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", marginTop: "0.4rem" }}
            onClick={this.handleGoogleLoginClick}
          >
            Having trouble? Use simulated OAuth
          </button>
        </div>
      </form>
    );
  };

  renderProfileForm = () => {
    const user = getAuthUser();
    if (!user) return <p style={{ color: "rgba(255,255,255,0.6)" }}>No profile session active.</p>;

    const initialLetter = user.name ? user.name.charAt(0).toUpperCase() : "U";

    return (
      <div className="profile-card">
        <div className="profile-avatar-container">
          {user.photo ? (
            <img src={user.photo} alt={user.name} referrerPolicy="no-referrer" />
          ) : (
            initialLetter
          )}
        </div>
        <h3 className="profile-name">{user.name}</h3>
        <p className="profile-role">YatraMitra Member</p>

        <div className="profile-details-list">
          <div className="profile-detail-item">
            <span className="profile-detail-label">Email</span>
            <span className="profile-detail-value">{user.email}</span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-label">Mobile</span>
            <span className="profile-detail-value">{user.phone || "Not provided"}</span>
          </div>
        </div>

        <button type="button" className="profile-logout-btn" onClick={this.handleLogout}>
          Sign Out
        </button>
      </div>
    );
  };

  renderGoogleMock = () => {
    const { googleEmail, googleName, email, name, loading } = this.state;

    const suggestedEmail = email ? email.toLowerCase().trim() : "";
    const suggestedName = name ? name.trim() : "";

    return (
      <div className="google-mock-container" style={{ textAlign: "center", color: "white" }}>
        <img src="/static/img/google.png" alt="google" style={{ width: "40px", marginBottom: "1rem" }} />
        <h3 style={{ color: "white", fontSize: "1.3rem", fontWeight: "700", marginBottom: "0.2rem" }}>Choose an account</h3>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          to continue to YatraMitra
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.5rem", maxHeight: "180px", overflowY: "auto", padding: "4px" }}>
          {suggestedEmail && (
            <button
              type="button"
              className="google-oauth-btn"
              style={{ justifyContent: "flex-start", background: "rgba(0, 188, 212, 0.15)", border: "1px solid rgba(0, 188, 212, 0.3)", color: "white" }}
              onClick={() => this.useMockGoogleAccount(suggestedName || suggestedEmail.split("@")[0], suggestedEmail)}
              disabled={loading}
            >
              👤 {suggestedName || suggestedEmail.split("@")[0]} ({suggestedEmail})
            </button>
          )}
          <button
            type="button"
            className="google-oauth-btn"
            style={{ justifyContent: "flex-start", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
            onClick={() => this.useMockGoogleAccount("Vaibhav Sharma", "vaibhav@gmail.com")}
            disabled={loading}
          >
            👤 Vaibhav Sharma (vaibhav@gmail.com)
          </button>
          <button
            type="button"
            className="google-oauth-btn"
            style={{ justifyContent: "flex-start", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
            onClick={() => this.useMockGoogleAccount("Google Explorer", "googleexplorer@gmail.com")}
            disabled={loading}
          >
            👤 Google Explorer (googleexplorer@gmail.com)
          </button>
        </div>

        <div className="auth-divider">Or enter custom Google details</div>

        <form onSubmit={this.submitGoogleMock}>
          <div className="auth-form-group" style={{ textAlign: "left" }}>
            <label>Google Name</label>
            <input
              type="text"
              name="googleName"
              className="auth-input-field"
              placeholder="e.g. Rahul Singh"
              value={googleName}
              onChange={this.handleChange}
              required
            />
          </div>
          <div className="auth-form-group" style={{ textAlign: "left" }}>
            <label>Google Email</label>
            <input
              type="email"
              name="googleEmail"
              className="auth-input-field"
              placeholder="e.g. rahul@gmail.com"
              value={googleEmail}
              onChange={this.handleChange}
              required
            />
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Authenticating Google..." : "Continue to YatraMitra"}
          </button>
        </form>
      </div>
    );
  };

  renderForgotPasswordForm = () => {
    const { email, loading } = this.state;
    return (
      <form onSubmit={this.handleForgotPasswordSubmit} className="auth-body">
        <div className="auth-form-group">
          <label>Email Address</label>
          <div className="auth-input-container">
            <span className="auth-input-icon">📧</span>
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
              className="auth-input-field"
              value={email}
              onChange={this.handleChange}
              required
            />
          </div>
        </div>
        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? "Sending link..." : "Send Reset Link"}
        </button>
        <div style={{ textAlign: "center", marginTop: "1.2rem" }}>
          <button
            type="button"
            style={{ background: "transparent", border: "none", color: "#00BCD4", fontSize: "0.85rem", cursor: "pointer", fontWeight: "600" }}
            onClick={() => this.setState({ mode: "signin" })}
          >
            ← Back to Sign In
          </button>
        </div>
      </form>
    );
  };

  render() {
    const { visible, mode } = this.state;
    if (!visible) return null;

    let title = "Sign In";
    let subtitle = "Welcome back! Login to book your travel";

    if (mode === "signup") {
      title = "Create Account";
      subtitle = "Register to enjoy premium booking features";
    } else if (mode === "profile") {
      title = "My Profile";
      subtitle = "Your account dashboard";
    } else if (mode === "google-mock") {
      title = "Sign In with Google";
      subtitle = "Simulating social auth secure OAuth flow";
    } else if (mode === "forgot-password") {
      title = "Forgot Password";
      subtitle = "Enter your email to receive password reset instructions";
    }

    return (
      <div className="auth-modal-overlay" onClick={this.handleClose}>
        <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
          <button className="auth-close-btn" onClick={this.handleClose}>
            ✕
          </button>

          <div className="auth-header">
            <h2 className="auth-title">{title}</h2>
            <p className="auth-subtitle">{subtitle}</p>
          </div>

          {(mode === "signin" || mode === "signup") && (
            <div className="auth-main-tabs">
              <button
                type="button"
                className={`auth-main-tab ${mode === "signin" ? "active" : ""}`}
                onClick={() => this.handleTabChange("signin")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-main-tab ${mode === "signup" ? "active" : ""}`}
                onClick={() => this.handleTabChange("signup")}
              >
                Sign Up
              </button>
            </div>
          )}

          {mode === "signin" && this.renderSignInForm()}
          {mode === "signup" && this.renderSignUpForm()}
          {mode === "profile" && this.renderProfileForm()}
          {mode === "google-mock" && this.renderGoogleMock()}
          {mode === "forgot-password" && this.renderForgotPasswordForm()}
        </div>
      </div>
    );
  }
}

export default AuthModal;
