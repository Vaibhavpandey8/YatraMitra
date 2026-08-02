import React, { useState } from "react";
import SigninForm from "./SigninForm";
import { Redirect } from "react-router-dom";
import {
  signIn,
  authenticate,
  isAuthenticated
} from "../../../Utils/Requests/Auth";

const Login = () => {
  const [state, setState] = useState({
    email: "sadmin@sadmin.com",
    password: "qwerty12345",
    error: "",
    loading: false
  });

  const { email, password, loading, error } = state;

  const handleChange = event => {
    setState({
      ...state,
      error: false,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setState({ ...state, error: false, loading: true });
    const data = await signIn({ email, password }).catch(err => {
      setState({
        ...state,
        loading: false,
        error:
          err.response && err.response.data && err.response.data.error
            ? err.response.data.error
            : "Something went wrong!"
      });
    });

    if (data && data.status === 200) {
      authenticate(data, () => {
        if (isAuthenticated()) {
          setState({ ...state, loading: false });
        }
      });
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

  const redirectUser = () => <Redirect to="/" />;

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
          <div style={{ width: "100%", maxWidth: "380px", margin: "0 auto 1rem", position: "relative", zIndex: 10 }}>
            {loading && showLoading()}
            {error && showError()}
          </div>
          {!loading && (
            <SigninForm
              handleSubmit={handleSubmit}
              handleChange={handleChange}
              state={state}
            />
          )}
        </div>
      </div>

      {isAuthenticated() && redirectUser()}
    </div>
  );
};

export default Login;
