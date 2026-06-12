import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAuthUser, getAuthToken, getUserProfileApi } from "../utils/auth";
import { getMyBookingsApi, postRatingApi } from "../actions/book";
import { Card, Row, Col, Spin, Tag, Button, Empty, Rate, Modal, Input } from "antd";
import Router from "next/router";
import Swal from "sweetalert2";
import moment from "moment";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rating Modal States
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [selectedBusForRating, setSelectedBusForRating] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const handleOpenRatingModal = (booking) => {
    setSelectedBusForRating({
      busId: booking.bus._id,
      travelName: booking.bus.travel ? booking.bus.travel.name : "Travels",
      busName: booking.bus.name || "Express"
    });
    setRatingValue(5);
    setReviewText("");
    setIsRatingModalVisible(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedBusForRating) return;
    const token = getAuthToken();
    if (!token) {
      Swal.fire("Error", "Session expired. Please sign in again.", "error");
      return;
    }

    setSubmittingRating(true);
    try {
      const resp = await postRatingApi({
        busId: selectedBusForRating.busId,
        rating: ratingValue,
        review: reviewText
      }, token);

      if (resp && resp.error) {
        Swal.fire("Error", resp.error, "error");
      } else {
        Swal.fire("Success!", "Thank you for your rating & review!", "success");
        setIsRatingModalVisible(false);
        fetchBookings(token);
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not submit rating. Please try again.", "error");
    } finally {
      setSubmittingRating(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    const authUser = getAuthUser();
    if (!token || !authUser) {
      Swal.fire("Access Denied", "Please sign in to view your bookings.", "info");
      Router.push("/");
      return;
    }

    setUser(authUser);
    fetchProfile(token);
    fetchBookings(token);
  }, []);

  const fetchProfile = async (token) => {
    try {
      const data = await getUserProfileApi(token);
      if (data && !data.error) {
        setUser(data);
      }
    } catch (err) {
      console.error("Error fetching live profile:", err);
    }
  };

  const handleCopyReferral = () => {
    if (!user || !user.referralCode) return;
    const inviteLink = `${window.location.origin}/?ref=${user.referralCode}`;
    navigator.clipboard.writeText(inviteLink);
    Swal.fire({
      title: "Invite Link Copied! 🔗",
      html: `Promo Link: <br/><strong style="color:#00BCD4;">${inviteLink}</strong><br/><br/>Share this link with your friends. Jab wo register karenge, toh unhe <strong>₹50 Starting Bonus</strong> milega aur aapko <strong>₹100 Referral Reward</strong>!`,
      background: "#0d162d",
      color: "white",
      confirmButtonText: "Awesome",
      confirmButtonColor: "#00BCD4",
      customClass: {
        popup: "glassmorphic-swal"
      }
    });
  };

  const fetchBookings = async (token) => {
    try {
      const data = await getMyBookingsApi(token);
      if (data && data.error) {
        Swal.fire("Error", data.error, "error");
      } else {
        setBookings(data || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not load booking details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = (booking) => {
    if (!booking) return;

    const passengerName = user ? user.name : (booking.guest ? booking.guest.name : "Traveler");
    const passengerEmail = user ? user.email : (booking.guest ? booking.guest.email : "N/A");
    const passengerPhone = booking.guest ? booking.guest.phone : "N/A";
    const statusColor = (booking.verification === "verified" || booking.verification === "payed") ? "#00e676" : "#fb8c00";

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>YatraMitra E-Ticket - ${booking._id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
            body { font-family: 'Poppins', sans-serif; padding: 30px; color: #333; background: #fff; }
            .ticket-box { border: 2px dashed #00BCD4; border-radius: 12px; padding: 25px; max-width: 650px; margin: 0 auto; background: #fafafa; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #00BCD4; letter-spacing: 0.5px; }
            .title { font-size: 16px; font-weight: 600; text-transform: uppercase; color: #555; letter-spacing: 1px; }
            .section-title { font-size: 13px; font-weight: 700; color: #777; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            .info-item { font-size: 13px; }
            .info-label { font-weight: 600; color: #666; }
            .info-value { color: #222; }
            .footer-note { text-align: center; font-size: 11px; color: #888; margin-top: 25px; border-top: 1px dashed #eee; padding-top: 15px; line-height: 1.5; }
            .barcode { text-align: center; font-size: 28px; letter-spacing: 5px; font-family: monospace; margin: 20px 0; color: #222; font-weight: bold; }
            .print-btn { display: block; width: 100%; text-align: center; background: #00BCD4; color: white; border: none; padding: 12px; border-radius: 6px; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 20px; text-decoration: none; box-shadow: 0 4px 10px rgba(0, 188, 212, 0.25); transition: background 0.2s; }
            .print-btn:hover { background: #0097a7; }
            @media print { .print-btn { display: none; } body { padding: 0; background: none; } .ticket-box { border: 2px dashed #333; box-shadow: none; background: none; margin: 0; max-width: 100%; } }
          </style>
        </head>
        <body>
          <div class="ticket-box">
            <div class="header">
              <div class="logo">YatraMitra</div>
              <div class="title">Official E-Ticket</div>
            </div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Ticket ID:</span> <span class="info-value">${booking._id}</span></div>
              <div class="info-item"><span class="info-label">Booking Date:</span> <span class="info-value">${moment(booking.createdAt).format("DD MMM YYYY, hh:mm A")}</span></div>
            </div>
            
            <div class="section-title">Journey Details</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Route:</span> <span class="info-value">${booking.bus.startLocation.name} ➔ ${booking.bus.endLocation.name}</span></div>
              <div class="info-item"><span class="info-label">Travels Operator:</span> <span class="info-value">${booking.bus.travel.name}</span></div>
              <div class="info-item"><span class="info-label">Journey Date:</span> <span class="info-value">${booking.bus.journeyDate}</span></div>
              <div class="info-item"><span class="info-label">Departure Time:</span> <span class="info-value">${booking.bus.departure_time}</span></div>
              <div class="info-item"><span class="info-label">Bus Type:</span> <span class="info-value">${booking.bus.type}</span></div>
              <div class="info-item"><span class="info-label">Seat Number:</span> <span class="info-value" style="font-weight: 800; color: #00BCD4; font-size: 15px;">${booking.seatNumber}</span></div>
            </div>
            
            <div class="section-title">Passenger Details</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Primary Passenger:</span> <span class="info-value">${passengerName}</span></div>
              <div class="info-item"><span class="info-label">Email Address:</span> <span class="info-value">${passengerEmail}</span></div>
              <div class="info-item"><span class="info-label">Mobile Number:</span> <span class="info-value">${passengerPhone !== "N/A" ? passengerPhone : (user ? user.phone || "N/A" : "N/A")}</span></div>
              <div class="info-item"><span class="info-label">Ticket Status:</span> <span class="info-value" style="text-transform: uppercase; font-weight: 700; color: ${statusColor};">${booking.verification === 'verified' || booking.verification === 'payed' ? 'Confirmed' : 'Pending Verification'}</span></div>
            </div>
            
            <div class="section-title">Payment Summary</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Total Fare Paid:</span> <span class="info-value" style="font-weight:700;">Rs. ${booking.price || booking.bus.fare}</span></div>
              <div class="info-item"><span class="info-label">Payment Status:</span> <span class="info-value" style="color: #00e676; font-weight:600;">Paid</span></div>
            </div>

            <div class="barcode">|||||I||II|||I|I|||II|||</div>
            
            <div class="footer-note">
              Please carry a printed copy or show this digital e-ticket on your mobile during boarding. 
              Boarding Point: <strong>${booking.boardingPoints || 'Main Buspark'}</strong>.<br>
              Thank you for choosing YatraMitra. Have a safe and comfortable journey!
            </div>
            <button class="print-btn" onclick="window.print()">Print Ticket / Save PDF</button>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderStatus = (status) => {
    if (status === "verified" || status === "payed") {
      return <Tag color="green">CONFIRMED</Tag>;
    }
    return <Tag color="orange">PENDING VERIFICATION</Tag>;
  };

  return (
    <Layout>
      <div className="dashboard-container">
        {/* User profile section */}
        {user && (
          <div className="dashboard-profile-header">
            <h1 className="dashboard-title">Passenger Dashboard</h1>
            <Card className="dashboard-profile-card" bordered={false}>
              <Row align="middle" gutter={24} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
                <Col xs={24} sm={4} className="profile-icon-wrapper">
                  <div className="dashboard-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Col>
                <Col xs={24} sm={20}>
                  <h2 className="dashboard-user-name">{user.name}</h2>
                  <p className="dashboard-user-email">📧 {user.email}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
                    <Tag color="cyan">YatraMitra Member 🎖️</Tag>
                    {user.referralCode && (
                      <Tag color="purple">Referral Code: {user.referralCode} 🎫</Tag>
                    )}
                  </div>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} sm={8}>
                  <div className="dashboard-stat-box" style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "1rem",
                    textAlign: "center",
                    height: "100%"
                  }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.2rem" }}>👛</div>
                    <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Wallet Balance</div>
                    <div style={{ color: "#00BCD4", fontSize: "1.4rem", fontWeight: "700", marginTop: "0.2rem" }}>₹{user.wallet || 0}</div>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="dashboard-stat-box" style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "1rem",
                    textAlign: "center",
                    height: "100%"
                  }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.2rem" }}>💰</div>
                    <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Cashback</div>
                    <div style={{ color: "#22c55e", fontSize: "1.4rem", fontWeight: "700", marginTop: "0.2rem" }}>₹{user.totalCashbackEarned || 0}</div>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="dashboard-stat-box" style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "1rem",
                    textAlign: "center",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                  }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.2rem" }}>🔗</div>
                    <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.4rem" }}>Referral Program</div>
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={handleCopyReferral}
                      style={{
                        background: "linear-gradient(135deg, #00BCD4, #0097a7)",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        fontSize: "0.78rem"
                      }}
                      disabled={!user.referralCode}
                    >
                      Copy Invite Link 🔗
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        )}

        {/* Bookings history list */}
        <div className="bookings-section">
          <h2 className="section-heading">My Booking History</h2>

          {loading ? (
            <div className="dashboard-loading">
              <Spin size="large" />
              <p>Loading your tickets...</p>
            </div>
          ) : bookings.length === 0 ? (
            <Card className="empty-dashboard-card" bordered={false}>
              <Empty
                description={<span style={{ color: "rgba(255,255,255,0.6)" }}>You don't have any bookings yet.</span>}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => Router.push("/buses")}>
                  Book Bus Ticket Now 🚌
                </Button>
              </Empty>
            </Card>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <Card key={booking._id} className="booking-list-card" bordered={false}>
                  <Row align="middle" gutter={[16, 24]}>
                    <Col xs={24} md={16}>
                      <div className="booking-bus-info">
                        <div className="ticket-bus-icon">🎫</div>
                        <div>
                          <h3 className="booking-bus-name">
                            {booking.bus.travel ? booking.bus.travel.name : "Travels"} - {booking.bus.name || "Express"}
                          </h3>
                          <div className="booking-route-detail">
                            <span className="route-text">
                              {booking.bus.startLocation.name} ➔ {booking.bus.endLocation.name}
                            </span>
                            <span className="divider-dot">•</span>
                            <span className="date-text">📅 {booking.bus.journeyDate}</span>
                            <span className="divider-dot">•</span>
                            <span className="time-text">🕒 {booking.bus.departure_time}</span>
                          </div>
                          <div className="booking-seat-detail">
                            <span>Seat Number: <strong className="seat-badge">{booking.seatNumber}</strong></span>
                            <span className="divider-dot">•</span>
                            <span>Fare: <strong>Rs. {booking.price || booking.bus.fare}</strong></span>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} md={8} className="booking-actions-section">
                      <div className="status-wrapper">
                        {renderStatus(booking.verification)}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
                        <Button
                          type="primary"
                          icon="download"
                          onClick={() => handleDownloadTicket(booking)}
                          className="download-ticket-btn"
                          style={{ width: "100%" }}
                        >
                          Download Ticket 📥
                        </Button>
                        {(booking.verification === "verified" || booking.verification === "payed") && (
                          <Button
                            type="dashed"
                            onClick={() => handleOpenRatingModal(booking)}
                            style={{
                              width: "100%",
                              background: "rgba(250, 219, 20, 0.05)",
                              borderColor: "#fadb14",
                              color: "#fadb14",
                              fontWeight: "500"
                            }}
                          >
                            Rate & Review ⭐
                          </Button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        title={selectedBusForRating ? `Rate & Review - ${selectedBusForRating.travelName}` : "Rate & Review"}
        visible={isRatingModalVisible}
        onCancel={() => setIsRatingModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsRatingModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submittingRating}
            onClick={handleSubmitRating}
          >
            Submit Review
          </Button>
        ]}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "1rem" }}>How was your journey on <b>{selectedBusForRating ? `${selectedBusForRating.travelName} (${selectedBusForRating.busName})` : "this bus"}</b>?</p>
          <Rate
            allowClear={false}
            value={ratingValue}
            onChange={(val) => setRatingValue(val)}
            style={{ fontSize: "2.5rem" }}
          />
        </div>
        <div>
          <h4>Write a Review (Optional)</h4>
          <Input.TextArea
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience about bus quality, service, or driver behavior..."
            maxLength={500}
          />
        </div>
      </Modal>
    </Layout>
  );
};

export default Dashboard;
