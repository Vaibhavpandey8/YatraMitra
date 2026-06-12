import React from "react";
import { Link, withRouter } from "react-router-dom";
import { isAuthenticated } from "../../Utils/Requests/Auth";

const Header = ({ history }) => {
  const { user } = isAuthenticated();

  return (
    <header className="main-header">
      <div className="header-marquee full-width">
        <div className="marquee-content">
          <span>🙏✨ Welcome to YatraMitra Admin Panel 🚍 | 🚌 Manage Buses • 🎟️ Track Bookings • 📊 Monitor Revenue • 🌍 Deliver Seamless Travel Experiences ✨</span>
          <span>🙏✨ Welcome to YatraMitra Admin Panel 🚍 | 🚌 Manage Buses • 🎟️ Track Bookings • 📊 Monitor Revenue • 🌍 Deliver Seamless Travel Experiences ✨</span>
        </div>
      </div>
    </header>
  );
};

export default withRouter(Header);
