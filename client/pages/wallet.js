import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAuthUser, getAuthToken, getUserProfileApi, createRazorpayOrderApi, verifyRazorpayPaymentApi } from "../utils/auth";
import { Card, Button, Spin, Tag } from "antd";
import Router from "next/router";
import Swal from "sweetalert2";

const WalletPage = () => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [rechargeLoading, setRechargeLoading] = useState(false);

  const fetchWalletDetails = async (token) => {
    try {
      const data = await getUserProfileApi(token);
      if (data && !data.error) {
        setUser(data);
        setWallet(data.wallet);
      }
    } catch (err) {
      console.error("Error fetching wallet details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load Razorpay checkout script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    const token = getAuthToken();
    const authUser = getAuthUser();
    if (!token || !authUser) {
      Swal.fire("Access Denied", "Please sign in to view your wallet.", "info");
      Router.push("/");
      return;
    }

    setUser(authUser);
    fetchWalletDetails(token);

    const handleWalletUpdate = () => {
      fetchWalletDetails(token);
    };
    window.addEventListener("wallet-updated", handleWalletUpdate);

    return () => {
      window.removeEventListener("wallet-updated", handleWalletUpdate);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleRecharge = async () => {
    const amt = Number(rechargeAmount);
    if (isNaN(amt) || amt < 100) {
      Swal.fire("Validation Error", "Minimum recharge amount is ₹100!", "warning");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      Swal.fire("Error", "You must be signed in to recharge!", "error");
      return;
    }

    if (!window.Razorpay) {
      Swal.fire("Error", "Razorpay SDK failed to load. Please check your internet connection!", "error");
      return;
    }

    setRechargeLoading(true);

    try {
      const orderData = await createRazorpayOrderApi(token, amt);
      if (orderData && orderData.error) {
        setRechargeLoading(false);
        Swal.fire("Failed!", orderData.error, "error");
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "YatraMitra Wallet",
        description: `Wallet Recharge: ₹${amt}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          setRechargeLoading(true);
          try {
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amt
            };

            const verifyRes = await verifyRazorpayPaymentApi(token, verificationData);
            setRechargeLoading(false);
            if (verifyRes && verifyRes.error) {
              Swal.fire("Verification Failed!", verifyRes.error, "error");
            } else {
              setRechargeAmount("");
              Swal.fire(
                "Recharge Successful!",
                `₹${amt} has been successfully added to your wallet.`,
                "success"
              );
              window.dispatchEvent(new Event("wallet-updated"));
            }
          } catch (err) {
            setRechargeLoading(false);
            Swal.fire("Verification Error", "Could not verify transaction signature!", "error");
          }
        },
        prefill: {
          name: user ? user.name : "",
          email: user ? user.email : "",
          contact: user ? user.phone : ""
        },
        theme: {
          color: "#FF6B35"
        },
        modal: {
          ondismiss: () => {
            setRechargeLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setRechargeLoading(false);
      Swal.fire("Error", "Could not contact payment gateway. Please try again!", "error");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column" }}>
          <Spin size="large" />
          <p style={{ marginTop: "1rem", color: "rgba(255, 255, 255, 0.7)" }}>Loading wallet details...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: "4rem 2rem", maxWidth: "800px", margin: "0 auto", color: "white" }}>
        <h1 style={{ textAlign: "center", marginBottom: "3rem", fontSize: "2.5rem", fontWeight: "800" }}>
          <span style={{ color: "#FF6B35" }}>YatraMitra </span> Wallet
        </h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
          <div style={{ flex: "1 1 300px", display: "flex" }}>
            <Card style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "18px",
              boxShadow: "0 10px 30px rgba(255, 107, 53, 0.15)",
              textAlign: "center",
              padding: "2rem",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }} bordered={false}>
              <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>👛</div>
              <h3 style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Available Balance</h3>
              <div style={{ fontSize: "2.8rem", fontWeight: "900", color: "#FF6B35", margin: "0.5rem 0" }}>
                ₹{wallet !== null ? wallet : 0}
              </div>
              <Tag color="orange" style={{ fontSize: "0.85rem", padding: "0.2rem 0.6rem" }}>Instant Confirmation Active ⚡</Tag>
            </Card>
          </div>

          <div style={{ flex: "1 1 300px", display: "flex" }}>
            <Card style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "18px",
              padding: "2rem",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }} bordered={false}>
              <h3 style={{ color: "white", fontWeight: "700", fontSize: "1.2rem", marginBottom: "1rem" }}>Recharge Wallet</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Add funds to your wallet using secure UPI, Cards, or NetBanking to book seats instantly.
              </p>

              <div style={{ marginBottom: "1.2rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.7)", marginBottom: "0.4rem" }}>
                  Amount to Add (₹)
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)",
                    color: "rgba(255, 255, 255, 0.6)", fontWeight: "bold"
                  }}>₹</span>
                  <input
                    type="number"
                    style={{
                      width: "100%", padding: "0.75rem 1rem 0.75rem 2.2rem",
                      background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px", color: "white", outline: "none"
                    }}
                    placeholder="Enter amount (min ₹100)"
                    value={rechargeAmount}
                    onChange={e => setRechargeAmount(e.target.value)}
                    disabled={rechargeLoading}
                  />
                </div>
              </div>

              <Button
                type="primary"
                onClick={handleRecharge}
                disabled={rechargeLoading || !rechargeAmount || Number(rechargeAmount) < 100}
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #FF6B35, #ff8f00)",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                {rechargeLoading ? "Connecting to Razorpay..." : `Add ₹${rechargeAmount || "0"} to Wallet`}
              </Button>
            </Card>
          </div>
        </div>

        <Card style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "18px",
          marginTop: "2rem",
          padding: "1.5rem"
        }} title={<span style={{ color: "white", fontWeight: "700" }}>👛 Wallet Benefits</span>} bordered={false}>
          <ul style={{ color: "rgba(255, 255, 255, 0.75)", paddingLeft: "1.2rem", lineHeight: "2" }}>
            <li><strong>Instant Bookings:</strong> Skip payment gateways at checkout for 1-click instant seat confirmation.</li>
            <li><strong>5% Cashback:</strong> Automatically earn 5% cashback directly into your wallet on every booking.</li>
            <li><strong>Safe & Secure:</strong> All transactions are secured and processed using industry standard gateways.</li>
            <li><strong>Instant Refunds:</strong> Cancelled bookings get instantly credited back to your wallet.</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
};

export default WalletPage;
