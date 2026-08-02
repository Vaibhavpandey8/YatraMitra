import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAuthUser, getAuthToken, getUserProfileApi, removeAuth } from "../utils/auth";
import { Card, Row, Col, Spin, Tag, Button } from "antd";
import Router from "next/router";
import Swal from "sweetalert2";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (token) => {
    try {
      const data = await getUserProfileApi(token);
      if (data && !data.error) {
        setUser(data);
      }
    } catch (err) {
      console.error("Error fetching live profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    const authUser = getAuthUser();
    if (!token || !authUser) {
      Swal.fire("Access Denied", "Please sign in to view your profile.", "info");
      Router.push("/");
      return;
    }

    setUser(authUser);
    fetchProfile(token);
  }, []);

  const handleCopyReferral = () => {
    if (!user || !user.referralCode) return;
    const inviteLink = `${window.location.origin}/?ref=${user.referralCode}`;
    navigator.clipboard.writeText(inviteLink);
    Swal.fire({
      title: "Invite Link Copied! 🔗",
      html: `Promo Link: <br/><strong style="color:#e91e63;">${inviteLink}</strong><br/><br/>Share this link with your friends. Jab wo register karenge, toh unhe <strong>₹50 Starting Bonus</strong> milega aur aapko <strong>₹100 Referral Reward</strong>!`,
      background: "#0d162d",
      color: "white",
      confirmButtonText: "Awesome",
      confirmButtonColor: "#e91e63",
      customClass: {
        popup: "glassmorphic-swal"
      }
    });
  };

  const handleLogout = () => {
    removeAuth();
    Swal.fire("Signed Out", "You have been logged out", "success").then(() => {
      Router.push("/");
    });
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column" }}>
          <Spin size="large" />
          <p style={{ marginTop: "1rem", color: "rgba(255, 255, 255, 0.7)" }}>Loading profile details...</p>
        </div>
      </Layout>
    );
  }

  const initialLetter = user && user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <Layout>
      <div className="profile-container">
        <h1 className="profile-title">
          My <span style={{ color: "#e91e63" }}>Profile</span>
        </h1>

        <Card className="profile-card" bordered={false}>
          
          <div style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #e91e63, #c2185b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "white",
            margin: "0 auto 1.5rem",
            boxShadow: "0 8px 25px rgba(233, 30, 99, 0.45)",
            overflow: "hidden"
          }}>
            {user.photo ? (
              <img src={user.photo} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
            ) : (
              initialLetter
            )}
          </div>

          <h2 style={{ color: "white", fontWeight: "800", fontSize: "1.8rem", margin: "0.2rem 0" }}>
            {user.name}
          </h2>
          <p style={{ color: "#e91e63", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "600", marginBottom: "2rem" }}>
            YATRAMITRA MEMBER 🎖️
          </p>

          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "16px",
            padding: "1.2rem",
            textAlign: "left",
            marginBottom: "2rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.8rem 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.9rem" }}>Email Address</span>
              <span style={{ color: "white", fontWeight: "600", fontSize: "0.9rem" }}>{user.email}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.8rem 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.9rem" }}>Mobile Number</span>
              <span style={{ color: "white", fontWeight: "600", fontSize: "0.9rem" }}>{user.phone || "Not provided"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.8rem 0" }}>
              <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.9rem" }}>Current Address</span>
              <span style={{ color: "white", fontWeight: "600", fontSize: "0.9rem" }}>{user.address || "Not provided"}</span>
            </div>
          </div>

          {user.referralCode && (
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px dashed rgba(233, 30, 99, 0.3)",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "2rem"
            }}>
              <h4 style={{ color: "white", fontWeight: "700", marginBottom: "0.5rem" }}>👥 Invite & Earn Double</h4>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", marginBottom: "1.2rem", lineHeight: "1.5" }}>
                Earn ₹100 for every friend who joins YatraMitra. Your friend also receives a ₹50 signup welcome bonus!
              </p>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <Tag color="pink" style={{ fontSize: "0.9rem", padding: "0.3rem 0.8rem", fontWeight: "700" }}>
                  Code: {user.referralCode}
                </Tag>
                <Button 
                  type="primary"
                  onClick={handleCopyReferral}
                  style={{
                    background: "linear-gradient(135deg, #e91e63, #c2185b)",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    height: "36px",
                    boxShadow: "0 4px 10px rgba(233, 30, 99, 0.25)"
                  }}
                >
                  Copy Invite Link 🔗
                </Button>
              </div>
            </div>
          )}

          <Button
            type="primary"
            onClick={handleLogout}
            style={{
              width: "100%",
              height: "46px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #e53935, #b71c1c)",
              border: "none",
              fontWeight: "700",
              fontSize: "0.95rem",
              boxShadow: "0 4px 15px rgba(229, 57, 53, 0.3)"
            }}
          >
            Sign Out
          </Button>

        </Card>
      </div>
    </Layout>
  );
};

export default ProfilePage;
