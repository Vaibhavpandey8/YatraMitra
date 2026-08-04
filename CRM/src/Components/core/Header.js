/* eslint-disable */
import React from "react";
import { Link, withRouter } from "react-router-dom";
import { isAuthenticated, signout } from "../../Utils/Requests/Auth";
import { defaultAdminImage } from "../../Utils/helpers";
import { SERVER_ROUTE } from "../../Utils/config";

const Header = ({ history }) => {
  const { user } = isAuthenticated();

  const handleSignOut = (e) => {
    e.preventDefault();
    document.body.classList.remove("sidebar-open");
    if (signout()) {
      history.push("/");
    }
  };

  return (
    <header className="main-header">
      <div className="header-marquee full-width">
        <div className="marquee-content">
          <span>🙏✨ Welcome to YatraMitra Admin Panel 🚍 | 🚌 Manage Buses • 🎟️ Track Bookings • 📊 Monitor Revenue • 🌍 Deliver Seamless Travel Experiences ✨</span>
          <span>🙏✨ Welcome to YatraMitra Admin Panel 🚍 | 🚌 Manage Buses • 🎟️ Track Bookings • 📊 Monitor Revenue • 🌍 Deliver Seamless Travel Experiences ✨</span>
        </div>

        {user && (
          <div className="header-right-actions">
            <Link to="/profile" className="header-user-link" title="View Profile">
              <img
                src={
                  user.avatar
                    ? `${SERVER_ROUTE}/uploads/${user.avatar}`
                    : defaultAdminImage
                }
                alt="User"
                className="header-user-avatar"
              />
              <span className="header-user-name">{user.name}</span>
            </Link>
            <button className="header-logout-btn" onClick={handleSignOut} title="Sign Out" type="button">
              <i className="fa fa-sign-out" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default withRouter(Header);
