/* eslint-disable */
import React from "react";
import { Link, withRouter } from "react-router-dom";
import { isAuthenticated, signout } from "../../Utils/Requests/Auth";
import { defaultAdminImage } from "../../Utils/helpers";
import { SERVER_ROUTE } from "../../Utils/config";

const Header = ({ history }) => {
  const { user } = isAuthenticated();

  const toggleSidebar = () => {
    document.body.classList.toggle("sidebar-open");
  };

  const handleSignOut = (e) => {
    e.preventDefault();
    document.body.classList.remove("sidebar-open");
    if (signout()) {
      history.push("/");
    }
  };

  return (
    <header className="main-header">
      <div className="header-nav-container">
        <div className="header-left">
          <button
            className="mobile-sidebar-toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle Navigation Menu"
            type="button"
          >
            ☰
          </button>
          <Link to="/" className="crm-logo-link">
            <span className="crm-logo-icon">🚍</span>
            <span className="crm-brand-title">
              YatraMitra <span className="crm-badge-tag">CRM</span>
            </span>
          </Link>
        </div>

        <div className="header-marquee hidden-mobile">
          <div className="marquee-content">
            <span>🙏✨ Welcome to YatraMitra Admin Panel 🚍 | 🚌 Manage Buses • 🎟️ Track Bookings • 📊 Monitor Revenue • 🌍 Deliver Seamless Travel Experiences ✨</span>
            <span>🙏✨ Welcome to YatraMitra Admin Panel 🚍 | 🚌 Manage Buses • 🎟️ Track Bookings • 📊 Monitor Revenue • 🌍 Deliver Seamless Travel Experiences ✨</span>
          </div>
        </div>

        {user && (
          <div className="header-right">
            <Link to="/profile" className="header-user-info">
              <img
                src={
                  user.avatar
                    ? `${SERVER_ROUTE}/uploads/${user.avatar}`
                    : defaultAdminImage
                }
                alt="User"
                className="header-avatar"
              />
              <span className="header-user-name hidden-mobile">{user.name}</span>
            </Link>
            <button className="header-signout-btn" onClick={handleSignOut} title="Sign Out" type="button">
              <i className="fa fa-sign-out" />
              <span className="signout-text">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default withRouter(Header);
