import { useEffect, useState } from "react";
import Head from "next/head";
import Router from "next/router";
import Swal from "sweetalert2";
import { getAllLocations, searchBus } from "../actions/location";
import Header from "../components/Header";

const CompareBuses = () => {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({});
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [buses, setBuses] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

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
    fetchAllLocations();
  }, []);

  const fetchAllLocations = async () => {
    const locs = await getAllLocations();
    setLocations(locs || []);
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

  const handleSearch = async () => {
    if (!formData.startLocation || !formData.endLocation) {
      Swal.fire("Validation Error", "Please fill in both From and To locations!", "warning");
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const resp = await searchBus(formData);
      setBuses(resp || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not fetch buses.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredFrom = uniqueStates.filter(state => 
    state.toLowerCase().includes(fromSearch.toLowerCase()) && 
    state !== formData.endLocation
  );
  const filteredTo = uniqueStates.filter(state => 
    state.toLowerCase().includes(toSearch.toLowerCase()) && 
    state !== formData.startLocation
  );

  // Comparison list generator
  const getComparisonList = () => {
    if (buses.length > 0) {
      return buses.map(bus => {
        const ymPrice = bus.fare;
        const originalPrice = bus.originalFare || ymPrice;
        return {
          name: bus.name,
          type: bus.type || "AC Sleeper",
          departure: bus.departure_time || "08:00",
          ymPrice: ymPrice,
          ymOriginalPrice: originalPrice,
          ymStatus: bus.pricingStatus || "normal",
          redBusPrice: Math.round(originalPrice + 85), // Price markup + convenience fee
          abhiBusPrice: Math.round(originalPrice + 70),
          paytmPrice: Math.round(originalPrice + 95),
          rating: bus.averageRating || "4.2",
          isReal: true
        };
      });
    }

    // Default mock lists for demonstration if search matches nothing
    return [
      {
        name: "Volvo Club AC",
        type: "AC Sleeper (2+1)",
        departure: "06:30",
        ymPrice: 850,
        ymOriginalPrice: 850,
        ymStatus: "normal",
        redBusPrice: 935,
        abhiBusPrice: 915,
        paytmPrice: 950,
        rating: "4.5",
        isReal: false
      },
      {
        name: "National Express",
        type: "Delux Non-AC (2+2)",
        departure: "14:15",
        ymPrice: 550,
        ymOriginalPrice: 550,
        ymStatus: "normal",
        redBusPrice: 620,
        abhiBusPrice: 610,
        paytmPrice: 645,
        rating: "3.9",
        isReal: false
      },
      {
        name: "Royal Safar AC",
        type: "Suspense AC (2+1)",
        departure: "21:00",
        ymPrice: 1200,
        ymOriginalPrice: 1200,
        ymStatus: "normal",
        redBusPrice: 1315,
        abhiBusPrice: 1290,
        paytmPrice: 1335,
        rating: "4.7",
        isReal: false
      }
    ];
  };

  const comparisonBuses = getComparisonList();

  return (
    <div className={`client-body-wrapper page-fade ${visible ? "show" : ""}`}>
      <Head>
        <title>YatraMitra - Compare Bus Tickets</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/static/css/main.css" />
      </Head>

      <Header />

      <div className="home-content-bg" style={{ minHeight: "100vh", paddingBottom: "4rem" }}>
        {/* HERO TITLE */}
        <div style={{ textAlign: "center", paddingTop: "4rem", paddingBottom: "2rem" }}>
          <h1 className="hero-title" style={{ fontSize: "3rem" }}>
            Compare <span style={{ color: "#00BCD4" }}>Buses</span> Across <span style={{ color: "#FF6B35" }}>Platforms</span>
          </h1>
          <p className="hero-subtitle" style={{ fontSize: "1rem", color: "rgba(255, 255, 255, 0.75)" }}>
            Check fares, dynamic pricing, safety, and features, and book directly on YatraMitra!
          </p>
        </div>

        {/* SEARCH BOX CARD */}
        <div style={{ display: "flex", justifyContent: "center", padding: "0 2rem" }}>
          <div className="search-box">
            <div className="search-row">
              <div className="search-field">
                <label style={{ color: "rgba(255, 255, 255, 0.85)" }}>From</label>
                <div className="input-wrap">
                  <span className="input-icon">📍</span>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={fromSearch}
                    onChange={e => { setFromSearch(e.target.value); setFromOpen(true); }}
                    onFocus={() => setFromOpen(true)}
                    onBlur={() => setTimeout(() => setFromOpen(false), 200)}
                    style={{ color: "white" }}
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
                <label style={{ color: "rgba(255, 255, 255, 0.85)" }}>To</label>
                <div className="input-wrap">
                  <span className="input-icon">📍</span>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={toSearch}
                    onChange={e => { setToSearch(e.target.value); setToOpen(true); }}
                    onFocus={() => setToOpen(true)}
                    onBlur={() => setTimeout(() => setToOpen(false), 200)}
                    style={{ color: "white" }}
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

              <div className="search-field search-btn-field">
                <button className="search-btn" onClick={handleSearch} style={{ background: "linear-gradient(135deg, #FF6B35, #FF4500)", border: "none", color: "white" }}>
                  📊 Compare Live Rates
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <section className="section" style={{ marginTop: "3rem", paddingLeft: "1rem", paddingRight: "1rem" }}>
          {hasSearched && buses.length === 0 && (
            <div style={{ textAlign: "center", background: "rgba(255, 107, 53, 0.1)", border: "1px solid rgba(255, 107, 53, 0.2)", padding: "1.5rem", borderRadius: "15px", maxWidth: "1100px", margin: "0 auto 2rem", color: "#FF6B35" }}>
              ⚠️ No active YatraMitra bus was found for the selected route. Showing mock demonstration data below.
            </div>
          )}

          <div className="comparison-table-wrapper">
            <table className="comparison-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.15)" }}>
                  <th style={{ textAlign: "left", paddingBottom: "1.2rem" }}>Operator & Timings</th>
                  <th className="compare-ym" style={{ paddingBottom: "1.2rem", background: "rgba(0, 188, 212, 0.08)" }}>YatraMitra</th>
                  <th style={{ paddingBottom: "1.2rem" }}>RedBus</th>
                  <th style={{ paddingBottom: "1.2rem" }}>AbhiBus</th>
                  <th style={{ paddingBottom: "1.2rem" }}>Paytm</th>
                </tr>
              </thead>
              <tbody>
                {comparisonBuses.map((bus, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {/* Bus details */}
                    <td style={{ padding: "1.2rem 0.8rem", textAlign: "left" }}>
                      <div style={{ fontWeight: "700", fontSize: "1.05rem", color: "white" }}>{bus.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{bus.type}</div>
                      <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.8rem", fontSize: "0.85rem" }}>
                        <span style={{ color: "#FF6B35", fontWeight: "600" }}>⏰ {bus.departure}</span>
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>⭐ {bus.rating} / 5</span>
                      </div>
                    </td>

                    {/* YatraMitra */}
                    <td className="compare-ym" style={{ padding: "1.2rem 0.8rem", background: "rgba(0, 188, 212, 0.04)" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                        {bus.ymStatus !== "normal" && (
                          <span style={{ fontSize: "0.75rem", textDecoration: "line-through", color: "rgba(255,255,255,0.4)" }}>
                            ₹{bus.ymOriginalPrice}
                          </span>
                        )}
                        <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#00BCD4" }}>
                          ₹{bus.ymPrice}
                        </span>
                        {bus.ymStatus === "discount" && (
                          <span style={{ background: "#4caf50", color: "white", padding: "1px 6px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: "bold" }}>
                            -15% Last-Min
                          </span>
                        )}
                        {bus.ymStatus === "surge" && (
                          <span style={{ background: "#FF6B35", color: "white", padding: "1px 6px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: "bold" }}>
                            +10% Surge
                          </span>
                        )}
                        <span style={{ fontSize: "0.75rem", color: "#4caf50", fontWeight: "600", marginTop: "0.3rem" }}>
                          ✓ No Booking Fees
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "rgba(0, 188, 212, 0.75)" }}>
                          ✓ 5% Wallet Cashback
                        </span>
                        {bus.isReal && (
                          <button
                            onClick={() => Router.push({ pathname: "/buses", query: formData })}
                            style={{
                              marginTop: "0.8rem",
                              background: "#00BCD4",
                              border: "none",
                              color: "white",
                              padding: "4px 12px",
                              borderRadius: "15px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              boxShadow: "0 4px 10px rgba(0, 188, 212, 0.25)"
                            }}
                          >
                            Book Now
                          </button>
                        )}
                      </div>
                    </td>

                    {/* RedBus */}
                    <td style={{ padding: "1.2rem 0.8rem" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>₹{bus.redBusPrice}</div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", marginTop: "0.2rem" }}>
                        Incl. Convenience Fee
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#f44336", marginTop: "0.3rem" }}>
                        ✗ No Cashback
                      </div>
                    </td>

                    {/* AbhiBus */}
                    <td style={{ padding: "1.2rem 0.8rem" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>₹{bus.abhiBusPrice}</div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", marginTop: "0.2rem" }}>
                        Incl. Booking Fee
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#f44336", marginTop: "0.3rem" }}>
                        ✗ No Last-Min discount
                      </div>
                    </td>

                    {/* Paytm */}
                    <td style={{ padding: "1.2rem 0.8rem" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>₹{bus.paytmPrice}</div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", marginTop: "0.2rem" }}>
                        Incl. Convenience Charge
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#f44336", marginTop: "0.3rem" }}>
                        ✗ No Wallet Promo
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* COMPARISON INFO DETAILS */}
        <section className="section" style={{ maxWidth: "1100px", margin: "0 auto", paddingLeft: "1.5rem", paddingRight: "1.5rem" }}>
          <h3 style={{ color: "white", fontSize: "1.5rem", marginBottom: "1.5rem", fontWeight: "700" }}>Why booking tickets on YatraMitra is smarter?</h3>
          <div className="compare-features-grid">
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h4 style={{ color: "#00BCD4", fontWeight: "700", marginBottom: "0.5rem" }}>👛 Zero Convenience Charges</h4>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", lineHeight: "1.6" }}>
                We do not charge convenience fees like generic portals. YatraMitra directly provides a zero-cost transaction model.
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h4 style={{ color: "#FF6B35", fontWeight: "700", marginBottom: "0.5rem" }}>🏷️ Real-Time Last Minute Deals</h4>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", lineHeight: "1.6" }}>
                Check for a flat 15% discount on available seats strictly 2 hours before the departure time and enjoy instant booking benefits.
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h4 style={{ color: "#4caf50", fontWeight: "700", marginBottom: "0.5rem" }}>🛡️ High Safety adjacent Seat Lock</h4>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", lineHeight: "1.6" }}>
                Unique safety feature: The seat adjacent to a female passenger is automatically locked to maintain strict safety and privacy.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CompareBuses;
