import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../core/Layout";
import { isAuthenticated } from "../../../Utils/Requests/Auth";
import { SERVER_ROUTE } from "../../../Utils/config";
import { defaultAdminImage } from "../../../Utils/helpers";

const ViewProfile = () => {
  const { user } = isAuthenticated();

  return (
    <Layout title="My Profile">
      <div className="profile-view-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 0" }}>
        <div className="profile-card-glass" style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(13, 21, 38, 0.45)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "0.5px solid rgba(217, 119, 6, 0.25)",
          borderRadius: "20px",
          padding: "2.5rem 2rem",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
          color: "#fff",
          textAlign: "center"
        }}>
          {/* Avatar Image */}
          <div style={{ marginBottom: "1.5rem" }}>
            <img
              src={
                user.avatar
                  ? `${SERVER_ROUTE}/uploads/${user.avatar}`
                  : defaultAdminImage
              }
              alt="Profile"
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #f59e0b",
                boxShadow: "0 0 20px rgba(245, 158, 11, 0.35)"
              }}
            />
          </div>

          {/* User Details */}
          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#f8fafc", margin: "0 0 0.5rem" }}>
            {user.name}
          </h2>

          <div style={{ display: "inline-block", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "20px", padding: "0.25rem 1rem", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2rem" }}>
            {user.role}
          </div>

          {/* Info Rows */}
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "1.2rem", marginBottom: "2rem" }}>
            {/* Email */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255, 255, 255, 0.02)", padding: "0.85rem 1.2rem", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <i className="fa fa-envelope" style={{ color: "#f59e0b", fontSize: "1.1rem" }} />
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "rgba(255, 255, 255, 0.4)", letterSpacing: "0.5px" }}>Email Address</div>
                <div style={{ fontSize: "0.95rem", color: "#e2e8f0", fontWeight: "500" }}>{user.email}</div>
              </div>
            </div>

            {/* Phone */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255, 255, 255, 0.02)", padding: "0.85rem 1.2rem", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <i className="fa fa-phone" style={{ color: "#f59e0b", fontSize: "1.1rem" }} />
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "rgba(255, 255, 255, 0.4)", letterSpacing: "0.5px" }}>Phone Number</div>
                <div style={{ fontSize: "0.95rem", color: "#e2e8f0", fontWeight: "500" }}>{user.phone || "Not Provided"}</div>
              </div>
            </div>

            {/* ID Number */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255, 255, 255, 0.02)", padding: "0.85rem 1.2rem", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <i className="fa fa-id-card" style={{ color: "#f59e0b", fontSize: "1.1rem" }} />
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "700", color: "rgba(255, 255, 255, 0.4)", letterSpacing: "0.5px" }}>Citizenship / ID Number</div>
                <div style={{ fontSize: "0.95rem", color: "#e2e8f0", fontWeight: "500" }}>{user.citizenshipNumber || "Not Provided"}</div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Link to="/profile/edit" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%", padding: "0.85rem", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#080d18", border: "none", borderRadius: "10px", fontSize: "1rem", fontWeight: "700", textDecoration: "none", boxShadow: "0 4px 15px rgba(245, 158, 11, 0.25)", transition: "all 0.2s" }} className="profile-edit-btn">
            <i className="fa fa-pencil" />
            Edit Profile Credentials
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default ViewProfile;
