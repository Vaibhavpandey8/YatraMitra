import React, { useEffect, useState } from "react";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import "./nprogress.css";
import AuthModal from "../AuthModal";
import Swal from "sweetalert2";
import { getAuthUser, getAuthToken, getUserProfileApi, createRazorpayOrderApi, verifyRazorpayPaymentApi } from "../../utils/auth";

Router.onRouteChangeStart = url => NProgress.start();
Router.onRouteChangeComplete = url => {
  NProgress.done();
  window.scrollTo(0, 0);
};
Router.onRouteChangeError = url => NProgress.done();

const Nav = () => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);

  const fetchWallet = async (currentUser) => {
    if (!currentUser) {
      setWallet(null);
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    try {
      const profile = await getUserProfileApi(token);
      if (profile && typeof profile.wallet !== "undefined") {
        setWallet(profile.wallet);
      }
    } catch (err) {
      console.error("Error fetching wallet:", err);
    }
  };

  useEffect(() => {
    // Dynamically load Razorpay checkout script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    setVisible(true);
    const currentUser = getAuthUser();
    setUser(currentUser);
    if (currentUser) {
      fetchWallet(currentUser);
    }

    const handleAuthChange = () => {
      const u = getAuthUser();
      setUser(u);
      if (u) {
        fetchWallet(u);
      } else {
        setWallet(null);
      }
    };
    window.addEventListener("auth-changed", handleAuthChange);

    const handleWalletUpdate = () => {
      const u = getAuthUser();
      if (u) {
        fetchWallet(u);
      }
    };
    window.addEventListener("wallet-updated", handleWalletUpdate);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("wallet-updated", handleWalletUpdate);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const ref = searchParams.get("ref") || router.query.ref;
      if (ref) {
        localStorage.setItem("referredByCode", ref.toUpperCase().trim());
        console.log("Captured referral code from URL:", ref);
      }
    }
  }, [router.query]);

  const handleRechargeSubmit = async () => {
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
              setShowRechargeModal(false);
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
          color: "#00BCD4"
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

  const handleLogoClick = () => {
    router.push("/");
  };

  const isActive = (path) => {
    return router.pathname === path ? "active" : "inactive";
  };

  const isBusesActive = () => {
    return router.pathname.startsWith("/buses") ? "active" : "inactive";
  };

  const handleProfileClick = () => {
    if (user) {
      if (window.showProfileModal) {
        window.showProfileModal();
      }
    } else {
      if (window.showAuthModal) {
        window.showAuthModal();
      }
    }
  };

  const handleAuthClick = (tab) => {
    if (window.showAuthModal) {
      window.showAuthModal(null, tab);
    }
  };

  return (
    <>
      {/* HEADER MARQUEE */}
      <div className="header-marquee full-width">
        <div className="marquee-content">
          <span>🙏✨ Welcome to YatraMitra 🚍 | 🚌 Book Buses Online • 🎟️ Easy Bookings • 📊 Best Prices • 🌍 Seamless Travel Experiences ✨</span>
          <span>🙏✨ Welcome to YatraMitra 🚍 | 🚌 Book Buses Online • 🎟️ Easy Bookings • 📊 Best Prices • 🌍 Seamless Travel Experiences ✨</span>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className={`navbar page-fade ${visible ? "show" : ""}`}>
        <div className="logo-container">
          <div className="logo" onClick={handleLogoClick}>
            <img src="/static/logo.png" alt="logo" style={{width:"42px", height:"42px", borderRadius:"10px", objectFit:"cover"}} />
          </div>
        </div>
        <ul className="nav-links">
          <li>
            <Link href="/">
              <a className={`${isActive("/")} nav-home`}>Home</a>
            </Link>
          </li>
          {user && (
            <li>
              <Link href="/wallet">
                <a className={`${isActive("/wallet")} nav-wallet`}>Wallet</a>
              </Link>
            </li>
          )}
          <li>
            <Link href="/compare">
              <a className={`${isActive("/compare")} nav-compare`}>Compare Buses</a>
            </Link>
          </li>
          {user && (
            <li>
              <Link href="/profile">
                <a className={`${isActive("/profile")} nav-myprofile`}>Profile</a>
              </Link>
            </li>
          )}
          {user && (
            <li>
              <Link href="/dashboard">
                <a className={`${isActive("/dashboard")} nav-mybookings`}>My Bookings</a>
              </Link>
            </li>
          )}
        </ul>
        <div className="nav-right">
          {user && wallet !== null && (
            <div className="header-wallet-btn" onClick={() => setShowRechargeModal(true)} title="Click to Recharge Wallet">
              <span style={{ fontSize: "1.15rem" }}>👛</span>
              <span>₹{wallet}</span>
            </div>
          )}
          {user ? (
            <button className="nav-profile" onClick={handleProfileClick}>
              {user.photo ? (
                <img src={user.photo} alt="profile" className="nav-profile-img" referrerPolicy="no-referrer" />
              ) : (
                <span className="nav-profile-icon">👤</span>
              )}
              <span className="nav-profile-name">{user.name}</span>
            </button>
          ) : (
            <div className="nav-auth-buttons">
              <button className="nav-signin-btn" onClick={() => handleAuthClick("signin")}>
                Sign In
              </button>
              <button className="nav-signup-btn" onClick={() => handleAuthClick("signup")}>
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal rendered globally */}
      <AuthModal />

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="auth-modal-overlay" style={{ zIndex: 1001 }}>
          <div className="auth-modal-container" style={{ width: "450px" }}>
            <button className="auth-close-btn" onClick={() => setShowRechargeModal(false)}>×</button>
            <div className="auth-header">
              <h2 className="auth-title">Recharge YatraMitra Wallet</h2>
              <p className="auth-subtitle">Add virtual money to make instantly confirmed bookings</p>
            </div>

            <div className="auth-form-group" style={{ marginBottom: "1.5rem" }}>
              <label>Recharge Amount (₹)</label>
              <div className="auth-input-container">
                <span className="auth-input-icon" style={{ left: "0.9rem", top: "50%", transform: "translateY(-50%)", position: "absolute", color: "rgba(255, 255, 255, 0.6)", fontWeight: "bold" }}>₹</span>
                <input
                  type="number"
                  className="auth-input-field"
                  placeholder="Enter amount (min ₹100)"
                  value={rechargeAmount}
                  onChange={e => setRechargeAmount(e.target.value)}
                  style={{ paddingLeft: "2.2rem" }}
                  disabled={rechargeLoading}
                />
              </div>
            </div>

            <button 
              className="auth-submit-btn" 
              onClick={handleRechargeSubmit} 
              disabled={rechargeLoading || !rechargeAmount || Number(rechargeAmount) < 100}
              style={{
                background: "linear-gradient(135deg, #00BCD4, #0097a7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "1.5rem"
              }}
            >
              {rechargeLoading ? (
                <>
                  <span style={{
                    width: "18px", height: "18px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderTop: "2px solid #fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 1s linear infinite"
                  }} />
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                  <span>Connecting to Razorpay...</span>
                </>
              ) : (
                <span>Proceed to Pay ₹{rechargeAmount || "0"}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Nav;
