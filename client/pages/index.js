import { useEffect, useState } from "react";
import Head from "next/head";
import Router from "next/router";
import Swal from "sweetalert2";
import { getAllLocations } from "../actions/location";
import Header from "../components/Header";

const Home = () => {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({});
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal"
  ];

  const getStateName = (district) => {
    if (!district) return "";
    const prefix = district.split(" - ")[0].trim().toLowerCase();
    if (prefix === "delhi") return "Delhi";
    if (prefix === "up") return "Uttar Pradesh";
    if (prefix === "rajasthan") return "Rajasthan";
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  };

  const getUniqueStates = () => {
    const unique = new Set(INDIAN_STATES);
    locations.forEach(l => {
      const state = getStateName(l.district);
      if (state) unique.add(state);
    });
    return Array.from(unique).sort();
  };

  const uniqueStates = getUniqueStates();

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".scroll-anim").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => { fetchAllLocations(); }, []);

  const fetchAllLocations = async () => {
    const locs = await getAllLocations();
    setLocations(locs);
  };

  const showFooterModal = (type, e) => {
    if (e) e.preventDefault();
    
    let title = "";
    let html = "";
    
    switch (type) {
      case "about":
        title = "About YatraMitra";
        html = `
          <div style="text-align: left; color: rgba(255, 255, 255, 0.85); font-family: 'Poppins', sans-serif; line-height: 1.6;">
            <p><strong>YatraMitra</strong> is India's premier online bus ticketing portal. Our mission is to make bus travel comfortable, accessible, and affordable for everyone across the country.</p>
            <p>We partner with top-rated bus operators to provide premium fleet options, seamless GPS tracking, and a secure booking experience.</p>
            <p style="margin-top: 1.2rem; color: #00BCD4; font-weight: 600; text-align: center;">✨ Safar Shuru Karo, Tension Khatam Karo!</p>
          </div>
        `;
        break;
      case "contact":
        title = "Contact Support";
        html = `
          <div style="text-align: left; color: rgba(255, 255, 255, 0.85); font-family: 'Poppins', sans-serif; line-height: 1.6;">
            <p style="margin-bottom: 0.8rem;">We are here to help you 24/7. Reach out to us via any of the channels below:</p>
            <p>📧 <strong>Email:</strong> support@yatramitra.com</p>
            <p>📞 <strong>Toll-Free:</strong> +91 1800-123-4567</p>
            <p>📍 <strong>HQ Address:</strong> YatraMitra Towers, Sector 62, Noida, Uttar Pradesh, 201301</p>
          </div>
        `;
        break;
      case "careers":
        title = "Careers at YatraMitra";
        html = `
          <div style="text-align: left; color: rgba(255, 255, 255, 0.85); font-family: 'Poppins', sans-serif; line-height: 1.6;">
            <p>Join us in building the future of intercity travel. We are looking for passionate individuals for the following open roles:</p>
            <ul style="padding-left: 1.2rem; margin: 0.8rem 0;">
              <li><strong>Frontend Engineer (Next.js/React)</strong></li>
              <li><strong>Backend Developer (Node.js/Express)</strong></li>
              <li><strong>Product Designer (UI/UX)</strong></li>
              <li><strong>Customer Success Representative</strong></li>
            </ul>
            <p>Send your updated resume to <strong style="color: #00BCD4;">careers@yatramitra.com</strong></p>
          </div>
        `;
        break;
      case "blog":
        title = "YatraMitra Blog";
        html = `
          <div style="text-align: left; color: rgba(255, 255, 255, 0.85); font-family: 'Poppins', sans-serif; line-height: 1.6;">
            <p style="margin-bottom: 0.8rem;">Explore travel tips, destination guides, and the latest transit updates:</p>
            <div style="margin-bottom: 0.8rem; border-left: 3px solid #00BCD4; padding-left: 0.8rem;">
              <h4 style="color: white; margin: 0;">Top 10 Weekend Getaways from Delhi</h4>
              <small style="color: rgba(255,255,255,0.4)">June 2026 • 5 min read</small>
            </div>
            <div style="margin-bottom: 0.8rem; border-left: 3px solid #00BCD4; padding-left: 0.8rem;">
              <h4 style="color: white; margin: 0;">Bus Safety Tips for Solo Travelers</h4>
              <small style="color: rgba(255,255,255,0.4)">May 2026 • 4 min read</small>
            </div>
            <div style="margin-bottom: 0.8rem; border-left: 3px solid #00BCD4; padding-left: 0.8rem;">
              <h4 style="color: white; margin: 0;">Why Online Bus Booking is Smarter</h4>
              <small style="color: rgba(255,255,255,0.4)">April 2026 • 3 min read</small>
            </div>
          </div>
        `;
        break;
      case "help":
        title = "Help Center & FAQ";
        html = `
          <div style="text-align: left; color: rgba(255, 255, 255, 0.85); font-family: 'Poppins', sans-serif; max-height: 250px; overflow-y: auto; padding-right: 0.5rem; line-height: 1.6;">
            <p><strong>Q: How do I cancel my booking?</strong><br/>A: Go to your Profile -> Booking History, select your ticket and click "Cancel Booking". Refund will be processed as per policy.</p>
            <p style="margin-top: 0.8rem;"><strong>Q: What documents do I need to carry?</strong><br/>A: Please carry a digital copy of your booking confirmation (M-Ticket) and any valid Government ID proof (Aadhaar, PAN, Voter ID).</p>
            <p style="margin-top: 0.8rem;"><strong>Q: Can I change my boarding point?</strong><br/>A: Yes, boarding point can be changed up to 4 hours before the departure time by calling our support line.</p>
          </div>
        `;
        break;
      case "privacy":
        title = "Privacy Policy";
        html = `
          <div style="text-align: left; color: rgba(255, 255, 255, 0.85); font-family: 'Poppins', sans-serif; line-height: 1.6;">
            <p>At YatraMitra, we prioritize the protection of your personal data. We use industry-standard encryption protocols (SSL/TLS) to secure your payment details and identity inputs.</p>
            <p>We do not sell, rent, or share user personal information with third parties for promotional purposes. Read our full data statement under security compliance.</p>
          </div>
        `;
        break;
      case "terms":
        title = "Terms of Service";
        html = `
          <div style="text-align: left; color: rgba(255, 255, 255, 0.85); font-family: 'Poppins', sans-serif; line-height: 1.6;">
            <p>Welcome to YatraMitra. By accessing our services, you agree to abide by our booking guidelines, cancellation schedules, and co-passenger conduct policies.</p>
            <p>Bookings are subject to seat availability and schedule timings set by transit operators. YatraMitra acts as an intermediary booking agent.</p>
          </div>
        `;
        break;
      case "cancellation":
        title = "Cancellation & Refund Policy";
        html = `
          <div style="text-align: left; color: rgba(255, 255, 255, 0.85); font-family: 'Poppins', sans-serif; line-height: 1.6;">
            <p>Refund values are calculated dynamically based on time remaining before bus departure:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 0.8rem; font-size: 0.85rem;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); text-align: left; color: #00BCD4;">
                  <th style="padding: 6px 0;">Time Window</th>
                  <th style="padding: 6px 0; text-align: right;">Refund Percent</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 6px 0;">More than 24 hours</td>
                  <td style="padding: 6px 0; text-align: right; color: #4caf50;">90% Refund</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 6px 0;">Between 12 to 24 hours</td>
                  <td style="padding: 6px 0; text-align: right; color: #ffeb3b;">50% Refund</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0;">Less than 12 hours</td>
                  <td style="padding: 6px 0; text-align: right; color: #f44336;">No Refund</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
        break;
      default:
        return;
    }

    Swal.fire({
      title: title,
      html: html,
      background: "#0d162d",
      color: "white",
      confirmButtonText: "Close",
      confirmButtonColor: "#00BCD4",
      customClass: {
        popup: "glassmorphic-swal"
      }
    });
  };

  const onChangeFrom = (name) => {
    setFormData({ ...formData, startLocation: name });
    setFromSearch(name);
    setFromOpen(false);
  };

  const onChangeTo = (name) => {
    setFormData({ ...formData, endLocation: name });
    setToSearch(name);
    setToOpen(false);
  };

  const dummytransition = () => {
    if (!formData.startLocation || !formData.endLocation) {
      Swal.fire("Validation Error", "Please fill in both From and To locations!", "warning");
      return;
    }
    Router.push({ pathname: "/buses", query: formData });
  };

  const handleRouteClick = (query) => {
    Router.push({ pathname: "/buses", query });
  };

  const handleOfferClick = (offer) => {
    navigator.clipboard.writeText(offer.label);
    Swal.fire({
      title: "Code Copied! 🎟️",
      html: `Promo code <strong>${offer.label}</strong> has been copied to your clipboard.<br/>Use it at checkout to apply your discount!`,
      icon: "success",
      confirmButtonColor: "#00BCD4"
    });
  };

  const filteredFrom = uniqueStates.filter(state => 
    state.toLowerCase().includes(fromSearch.toLowerCase()) && 
    state !== formData.endLocation
  );
  const filteredTo = uniqueStates.filter(state => 
    state.toLowerCase().includes(toSearch.toLowerCase()) && 
    state !== formData.startLocation
  );

  const popularRoutes = [
    {
      from: "Delhi",
      to: "Uttar Pradesh",
      time: "6h 30m",
      price: "₹850",
      query: {
        startLocation: "6a2c0b7f9c66f6be6204447d",
        endLocation: "6a2c0b7f9c66f6be62044477",
        journeyDate: "2026-07-09"
      }
    },
    {
      from: "Gujarat",
      to: "Haryana",
      time: "8h 15m",
      price: "₹1200",
      query: {
        startLocation: "6a2c0b7e9c66f6be62044451",
        endLocation: "6a2c0b7e9c66f6be62044453",
        journeyDate: "2026-07-09"
      }
    },
    {
      from: "Bihar",
      to: "Chhattisgarh",
      time: "7h 00m",
      price: "₹950",
      query: {
        startLocation: "6a2c0b7e9c66f6be6204444a",
        endLocation: "6a2c0b7e9c66f6be6204444d",
        journeyDate: "2026-07-09"
      }
    },
    {
      from: "Haryana",
      to: "Himachal Pradesh",
      time: "4h 30m",
      price: "₹600",
      query: {
        startLocation: "6a2c0b7e9c66f6be62044453",
        endLocation: "6a2c0b7e9c66f6be62044455",
        journeyDate: "2026-07-09"
      }
    }
  ];

  const offers = [
    { title: "First Ride Free", desc: "Use code FIRST100 and get ₹100 off your ticket", label: "FIRST100" },
    { title: "Weekend Special", desc: "Use code WEEKEND20 and get 20% off on Sat/Sun bookings", label: "WEEKEND20" },
    { title: "Group Booking", desc: "Use code GROUP15 and get 15% off for 4+ seats booking", label: "GROUP15" },
  ];

  const features = [
    { icon: "🛡️", title: "Gender-Safe Seat Locking", desc: "Automatic adjacent seat locking is active to ensure safety and comfort for female passengers." },
    { icon: "👛", title: "5% Wallet Cashback", desc: "Get 5% instant cashback automatically credited to your wallet on every ticket booking." },
    { icon: "🤝", title: "Double Referral Program", desc: "Earn ₹100 for inviting a friend, and your friend gets ₹50 signup welcome bonus." },
    { icon: "⚡", title: "Dynamic Fare Engine", desc: "Get 15% last-minute discount within 2 hours of departure, with automatically managed 10% weekend surge pricing." },
    { icon: "🔄", title: "Real-Time Seating Sync", desc: "Live WebSockets sync passenger seat selections and bookings in real-time." },
    { icon: "⭐", title: "Verified Ratings & Reviews", desc: "Read and write verified operator reviews from actual travel history bookings." },
  ];

  return (
    <div className={`client-body-wrapper page-fade ${visible ? "show" : ""}`}>
      <Head>
        <title>YatraMitra - Safar Shuru Karo</title>
        <link rel="icon" href="/static/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/static/css/main.css" />
      </Head>

      <Header />

      {/* MAIN CONTENT BACKGROUND WRAPPER */}
      <div className="home-content-bg">
        {/* HERO */}
        <section className="hero">
          <div className={`hero-content page-fade ${visible ? "show" : ""}`}>
            <h1 className="hero-title">
              <span style={{color:"#00BCD4"}}>Safar </span>
              <span style={{color:"#00BCD4"}}>Shuru </span>
              <span style={{color:"#FF6B35"}}>Karo, </span>
              <br/>
              <span style={{color:"#FF6B35"}}>Tension </span>
              <span style={{color:"#e53935"}}>Khatam </span>
              <span style={{color:"#e91e63"}}>Karo</span>
            </h1>
            <p className="hero-subtitle">
              Instant Bus Booking, Best Prices Aur Comfortable Journey — Sab Ek Jagah
            </p>

            <div className="search-box">
              <div className="search-row">
                <div className="search-field">
                  <label>From</label>
                  <div className="input-wrap">
                    <span className="input-icon">📍</span>
                    <input
                      type="text"
                      placeholder="Enter city"
                      value={fromSearch}
                      onChange={e => { setFromSearch(e.target.value); setFromOpen(true); }}
                      onFocus={() => setFromOpen(true)}
                      onBlur={() => setTimeout(() => setFromOpen(false), 200)}
                    />
                    {fromOpen && filteredFrom.length > 0 && (
                      <div className="dropdown">
                        {filteredFrom.map(state => (
                          <div key={state} className="dropdown-item" onMouseDown={() => onChangeFrom(state)}>
                            {state}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="search-field">
                  <label>To</label>
                  <div className="input-wrap">
                    <span className="input-icon">📍</span>
                    <input
                      type="text"
                      placeholder="Enter city"
                      value={toSearch}
                      onChange={e => { setToSearch(e.target.value); setToOpen(true); }}
                      onFocus={() => setToOpen(true)}
                      onBlur={() => setTimeout(() => setToOpen(false), 200)}
                    />
                    {toOpen && filteredTo.length > 0 && (
                      <div className="dropdown">
                        {filteredTo.map(state => (
                          <div key={state} className="dropdown-item" onMouseDown={() => onChangeTo(state)}>
                            {state}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button className="search-btn" onClick={dummytransition}>
                🔍 Search Buses
              </button>
            </div>
          </div>
        </section>

        {/* POPULAR ROUTES */}
        <section className="section">
          <h2 className="section-title scroll-anim">Popular Routes</h2>
          <div className="routes-grid">
            {popularRoutes.map((route, i) => (
              <div
                className="route-card scroll-anim"
                key={i}
                onClick={() => handleRouteClick(route.query)}
              >
                <div className="route-from">{route.from}</div>
                <div className="route-divider">→</div>
                <div className="route-to">{route.to}</div>
                <div className="route-meta">
                  <span className="route-time">{route.time}</span>
                  <span className="route-price">{route.price}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* EXCLUSIVE OFFERS */}
        <section className="section offers-section">
          <h2 className="section-title scroll-anim">Exclusive Offers</h2>
          <div className="offers-grid">
            {offers.map((offer, i) => (
              <div
                className="offer-card scroll-anim"
                key={i}
                onClick={() => handleOfferClick(offer)}
                style={{ cursor: "pointer" }}
              >
                <div className="offer-icon">%</div>
                <div className="offer-title">{offer.title}</div>
                <div className="offer-desc">{offer.desc}</div>
                <button
                  className="offer-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOfferClick(offer);
                  }}
                >
                  {offer.label}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* WHY CHOOSE */}
        <section className="section features-section">
          <h2 className="section-title scroll-anim">Why Choose YatraMitra</h2>
          <p className="section-subtitle scroll-anim" style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", marginBottom: "3rem", fontSize: "1rem", maxWidth: "600px", marginLeft: "auto", marginRight: "auto", lineHeight: "1.6" }}>
            Make your journey safer, cost-effective, and more convenient with our custom digital engine and premium safety systems!
          </p>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="scroll-anim feature-card-custom" key={i}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                <img src="/static/logo.png" alt="logo" style={{width:"42px", height:"42px", borderRadius:"10px", objectFit:"cover"}} />
                <span className="footer-logo-text">YatraMitra</span>
              </div>
              <p className="footer-desc">Your trusted partner for comfortable and affordable bus travel across India.</p>
            </div>
            <div>
              <div className="footer-heading">Company</div>
              <ul className="footer-links">
                <li><a href="#" onClick={(e) => showFooterModal("about", e)}>About Us</a></li>
                <li><a href="#" onClick={(e) => showFooterModal("contact", e)}>Contact</a></li>
                <li><a href="#" onClick={(e) => showFooterModal("careers", e)}>Careers</a></li>
                <li><a href="#" onClick={(e) => showFooterModal("blog", e)}>Blog</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-heading">Support</div>
              <ul className="footer-links">
                <li><a href="#" onClick={(e) => showFooterModal("help", e)}>Help Center</a></li>
                <li><a href="#" onClick={(e) => showFooterModal("privacy", e)}>Privacy Policy</a></li>
                <li><a href="#" onClick={(e) => showFooterModal("terms", e)}>Terms of Service</a></li>
                <li><a href="#" onClick={(e) => showFooterModal("cancellation", e)}>Cancellation Policy</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-heading">Follow Us</div>
              <ul className="footer-links">
                <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">© 2026 YatraMitra. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
};

export default Home;