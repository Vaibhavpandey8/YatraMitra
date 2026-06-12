import React from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import Layout from "../../core/Layout";
import {
  getAllAvailableBuses,
  getAllUnavailableBuses,
  getAvailableBusesOfOwner,
  getUnavailableBusesOfOwner
} from "../../../Utils/Requests/Bus";
import { getOwners, getGuests, getUsers } from "../../../Utils/Requests/People";
import { isAuthenticated } from "../../../Utils/Requests/Auth";
import { getOwnerBookings, getAllBookings } from "../../../Utils/Requests/Booking";
import { getAllTravels } from "../../../Utils/Requests/Travel";

class Home extends React.Component {
  state = {
    user: {},
    busesCount: 0,
    availableBusesCount: 0,
    unavailableBusesCount: 0,

    peopleCount: 0,
    ownersCount: 0,
    usersCount: 0,
    guestsCount: 0,

    bookingsCount: 0,
    verifiedBookingsCount: 0,
    unverifiedBookingsCount: 0,
    paidBookingsCount: 0,

    revenue: 0,
    travelsCount: 0,
    loading: true,
    bookings: [],
    selectedMonth: new Date().getMonth()
  };

  async componentDidMount() {
    const { user } = isAuthenticated();
    this.setState({ user });

    this.setState({ loading: true });
    try {
      if (user && user.role === "superadmin") {
        await Promise.all([
          this.fetchSuperadminBusData(),
          this.fetchSuperadminPeopleData(),
          this.fetchSuperadminBookingData(),
          this.fetchTravelsData()
        ]);
      } else {
        await Promise.all([
          this.fetchOwnerBusData(),
          this.fetchOwnerBookingData(),
          this.fetchTravelsData()
        ]);
      }
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    } finally {
      this.setState({ loading: false });
    }
  }

  fetchSuperadminBusData = async () => {
    let availableCount = 0;
    let unavailableCount = 0;

    const [availableResp, unavailableResp] = await Promise.all([
      getAllAvailableBuses().catch(() => null),
      getAllUnavailableBuses().catch(() => null)
    ]);

    if (availableResp && availableResp.status === 200) {
      availableCount = availableResp.data.length;
    }
    if (unavailableResp && unavailableResp.status === 200) {
      unavailableCount = unavailableResp.data.length;
    }

    this.setState({
      busesCount: availableCount + unavailableCount,
      availableBusesCount: availableCount,
      unavailableBusesCount: unavailableCount
    });
  };

  fetchSuperadminPeopleData = async () => {
    let ownersCount = 0;
    let usersCount = 0;
    let guestsCount = 0;

    const [ownersResp, usersResp, guestsResp] = await Promise.all([
      getOwners().catch(() => null),
      getUsers().catch(() => null),
      getGuests().catch(() => null)
    ]);

    if (ownersResp && ownersResp.status === 200) {
      ownersCount = ownersResp.data.length;
    }
    if (usersResp && usersResp.status === 200) {
      usersCount = usersResp.data.length;
    }
    if (guestsResp && guestsResp.status === 200) {
      guestsCount = guestsResp.data.length;
    }

    this.setState({
      peopleCount: ownersCount + usersCount + guestsCount,
      ownersCount,
      usersCount,
      guestsCount
    });
  };

  fetchSuperadminBookingData = async () => {
    const resp = await getAllBookings().catch(() => null);
    if (resp && resp.status === 200) {
      let verified = 0;
      let unverified = 0;
      let paid = 0;
      let rev = 0;

      resp.data.forEach(booking => {
        const p = parseFloat(booking.price) || 0;
        rev += p;

        if (booking.verification === "verified") {
          verified++;
        } else if (booking.verification === "notverified") {
          unverified++;
        } else if (booking.verification === "payed") {
          paid++;
        }
      });

      this.setState({
        bookingsCount: resp.data.length,
        verifiedBookingsCount: verified,
        unverifiedBookingsCount: unverified,
        paidBookingsCount: paid,
        revenue: rev,
        bookings: resp.data
      });
    }
  };

  fetchOwnerBusData = async () => {
    let availableCount = 0;
    let unavailableCount = 0;

    const [availableResp, unavailableResp] = await Promise.all([
      getAvailableBusesOfOwner().catch(() => null),
      getUnavailableBusesOfOwner().catch(() => null)
    ]);

    if (availableResp && availableResp.status === 200) {
      availableCount = availableResp.data.length;
    }
    if (unavailableResp && unavailableResp.status === 200) {
      unavailableCount = unavailableResp.data.length;
    }

    this.setState({
      busesCount: availableCount + unavailableCount,
      availableBusesCount: availableCount,
      unavailableBusesCount: unavailableCount
    });
  };

  fetchOwnerBookingData = async () => {
    const resp = await getOwnerBookings().catch(() => null);
    if (resp && resp.status === 200) {
      let verified = 0;
      let unverified = 0;
      let paid = 0;
      let rev = 0;

      resp.data.forEach(booking => {
        const p = parseFloat(booking.price) || 0;
        rev += p;

        if (booking.verification === "verified") {
          verified++;
        } else if (booking.verification === "notverified") {
          unverified++;
        } else if (booking.verification === "payed") {
          paid++;
        }
      });

      this.setState({
        bookingsCount: resp.data.length,
        verifiedBookingsCount: verified,
        unverifiedBookingsCount: unverified,
        paidBookingsCount: paid,
        revenue: rev,
        bookings: resp.data
      });
    }
  };

  fetchTravelsData = async () => {
    const resp = await getAllTravels().catch(() => null);
    if (resp && resp.status === 200) {
      this.setState({
        travelsCount: resp.data.length
      });
    }
  };

  formatRevenue = (value) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  getPercentage = (value, total) => {
    if (!total) return "0%";
    return `${((value / total) * 100).toFixed(0)}%`;
  };

  getWeeklyRevenueData = () => {
    const { bookings = [], selectedMonth } = this.state;
    const currentYear = new Date().getFullYear();

    let w1 = 0;
    let w2 = 0;
    let w3 = 0;
    let w4 = 0;

    bookings.forEach(booking => {
      if (!booking.createdAt) return;
      const createdAt = new Date(booking.createdAt);
      if (createdAt.getFullYear() === currentYear && createdAt.getMonth() === selectedMonth) {
        const day = createdAt.getDate();
        const price = parseFloat(booking.price) || 0;
        if (day <= 7) {
          w1 += price;
        } else if (day <= 14) {
          w2 += price;
        } else if (day <= 21) {
          w3 += price;
        } else {
          w4 += price;
        }
      }
    });

    const total = w1 + w2 + w3 + w4;
    const isZero = total === 0;

    return {
      weeks: [w1, w2, w3, w4],
      total,
      chartData: {
        labels: isZero ? ["No Bookings"] : ["Week 1", "Week 2", "Week 3", "Week 4+"],
        datasets: [
          {
            data: isZero ? [1] : [w1, w2, w3, w4],
            backgroundColor: isZero ? ["#1e293b"] : ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"],
            hoverBackgroundColor: isZero ? ["#1e293b"] : ["#fbbf24", "#34d399", "#60a5fa", "#a78bfa"],
            borderWidth: isZero ? 2 : 0,
            borderColor: isZero ? "#334155" : "transparent"
          }
        ]
      }
    };
  };

  render() {
    const {
      user,
      busesCount,
      availableBusesCount,
      unavailableBusesCount,
      peopleCount,
      ownersCount,
      usersCount,
      guestsCount,
      bookingsCount,
      verifiedBookingsCount,
      unverifiedBookingsCount,
      paidBookingsCount,
      revenue,
      travelsCount
    } = this.state;

    const role = user ? user.role : "owner";

    const fleetChartData = {
      labels: ["Available", "Unavailable"],
      datasets: [
        {
          data: [availableBusesCount, unavailableBusesCount],
          backgroundColor: ["#f59e0b", "#334155"],
          hoverBackgroundColor: ["#fbbf24", "#475569"],
          borderWidth: 0
        }
      ]
    };

    const peopleChartData = {
      labels: ["Owners", "Users", "Guests"],
      datasets: [
        {
          data: [ownersCount, usersCount, guestsCount],
          backgroundColor: ["#f59e0b", "#10b981", "#4b5563"],
          hoverBackgroundColor: ["#fbbf24", "#34d399", "#6b7280"],
          borderWidth: 0
        }
      ]
    };

    const bookingsChartData = {
      labels: ["Verified", "Unverified", "Paid"],
      datasets: [
        {
          data: [verifiedBookingsCount, unverifiedBookingsCount, paidBookingsCount],
          backgroundColor: ["#10b981", "#ef4444", "#f59e0b"],
          hoverBackgroundColor: ["#34d399", "#f87171", "#fbbf24"],
          borderWidth: 0
        }
      ]
    };

    return (
      <Layout>
        <div className="dashboard-container">

          {/* Stat Cards */}
          <div className="stat-cards-grid">
            {/* Card 1: Buses */}
            <div className="stat-card">
              <div className="card-top">
                <span className="card-title">{role === "superadmin" ? "Total Buses" : "My Buses"}</span>
                <i className="fa fa-bus card-icon" />
              </div>
              <div className="card-value">{busesCount}</div>
              <div className="card-subtext">{availableBusesCount} available</div>
            </div>

            {/* Card 2: People or Travels */}
            {role === "superadmin" ? (
              <div className="stat-card">
                <div className="card-top">
                  <span className="card-title">Total People</span>
                  <i className="fa fa-users card-icon" />
                </div>
                <div className="card-value">{peopleCount}</div>
                <div className="card-subtext">Owners, users & guests</div>
              </div>
            ) : (
              <div className="stat-card">
                <div className="card-top">
                  <span className="card-title">Active Travels</span>
                  <i className="fa fa-building card-icon" />
                </div>
                <div className="card-value">{travelsCount}</div>
                <div className="card-subtext">Travel agencies</div>
              </div>
            )}

            {/* Card 3: Bookings */}
            <div className="stat-card">
              <div className="card-top">
                <span className="card-title">Bookings</span>
                <i className="fa fa-calendar card-icon" />
              </div>
              <div className="card-value">{bookingsCount}</div>
              <div className="card-subtext">{verifiedBookingsCount} verified</div>
            </div>

            {/* Card 4: Revenue */}
            <div className="stat-card">
              <div className="card-top">
                <span className="card-title">Revenue</span>
                <span className="card-icon" style={{ fontWeight: 'bold' }}>₹</span>
              </div>
              <div className="card-value">{this.formatRevenue(revenue)}</div>
              <div className="card-subtext">This month</div>
            </div>
          </div>

          {/* Section: Analytics */}
          <span className="section-label">System Status</span>

          <div className="row d-flex align-items-stretch">
            {/* Secondary Analytics Card (Left) */}
            {role === "superadmin" ? (
              <div className="col-md-6" style={{ marginBottom: "2rem" }}>
                <div className="dashboard-card" style={{ height: "100%", marginBottom: 0 }}>
                  <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "55px", boxSizing: "border-box" }}>
                    <h3>User Distribution</h3>
                  </div>
                  <div className="card-body-layout">
                    <div className="chart-container">
                      <Doughnut
                        data={peopleChartData}
                        options={{
                          cutoutPercentage: 75,
                          legend: { display: false },
                          maintainAspectRatio: false
                        }}
                        height={140}
                        width={140}
                      />
                    </div>
                    <div className="legend-container">
                      <table className="legend-table">
                        <tbody>
                          <tr>
                            <td className="lbl">
                              <span className="dot" style={{ background: '#f59e0b' }} />
                              Owners
                            </td>
                            <td className="val">{ownersCount}</td>
                            <td className="pct">{this.getPercentage(ownersCount, peopleCount)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">
                              <span className="dot" style={{ background: '#10b981' }} />
                              Users
                            </td>
                            <td className="val">{usersCount}</td>
                            <td className="pct">{this.getPercentage(usersCount, peopleCount)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">
                              <span className="dot" style={{ background: '#4b5563' }} />
                              Guests
                            </td>
                            <td className="val">{guestsCount}</td>
                            <td className="pct">{this.getPercentage(guestsCount, peopleCount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="col-md-6" style={{ marginBottom: "2rem" }}>
                <div className="dashboard-card" style={{ height: "100%", marginBottom: 0 }}>
                  <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "55px", boxSizing: "border-box" }}>
                    <h3>Booking Verification</h3>
                  </div>
                  <div className="card-body-layout">
                    <div className="chart-container">
                      <Doughnut
                        data={bookingsChartData}
                        options={{
                          cutoutPercentage: 75,
                          legend: { display: false },
                          maintainAspectRatio: false
                        }}
                        height={140}
                        width={140}
                      />
                    </div>
                    <div className="legend-container">
                      <table className="legend-table">
                        <tbody>
                          <tr>
                            <td className="lbl">
                              <span className="dot" style={{ background: '#10b981' }} />
                              Verified
                            </td>
                            <td className="val">{verifiedBookingsCount}</td>
                            <td className="pct">{this.getPercentage(verifiedBookingsCount, bookingsCount)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">
                              <span className="dot" style={{ background: '#ef4444' }} />
                              Unverified
                            </td>
                            <td className="val">{unverifiedBookingsCount}</td>
                            <td className="pct">{this.getPercentage(unverifiedBookingsCount, bookingsCount)}</td>
                          </tr>
                          <tr>
                            <td className="lbl">
                              <span className="dot" style={{ background: '#f59e0b' }} />
                              Paid
                            </td>
                            <td className="val">{paidBookingsCount}</td>
                            <td className="pct">{this.getPercentage(paidBookingsCount, bookingsCount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue breakdown by selected month (Right) */}
            <div className="col-md-6" style={{ marginBottom: "2rem" }}>
              <div className="dashboard-card" style={{ height: "100%", marginBottom: 0 }}>
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "55px", boxSizing: "border-box" }}>
                  <h3>Revenue Breakdown</h3>
                  <select
                    className="custom-select custom-select-sm"
                    style={{
                      width: "140px",
                      background: "#1e293b",
                      color: "#f59e0b",
                      borderColor: "#475569",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      outline: "none"
                    }}
                    value={this.state.selectedMonth}
                    onChange={(e) => this.setState({ selectedMonth: parseInt(e.target.value) })}
                  >
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => (
                      <option key={idx} value={idx}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="card-body-layout">
                  {(() => {
                    const { chartData, weeks, total } = this.getWeeklyRevenueData();
                    return (
                      <>
                        <div className="chart-container">
                          <Doughnut
                            data={chartData}
                            options={{
                              cutoutPercentage: 75,
                              legend: { display: false },
                              maintainAspectRatio: false
                            }}
                            height={140}
                            width={140}
                          />
                        </div>
                        <div className="legend-container">
                          <table className="legend-table">
                            <tbody>
                              <tr>
                                <td className="lbl">
                                  <span className="dot" style={{ background: '#f59e0b' }} />
                                  Week 1 (1-7)
                                </td>
                                <td className="val">₹{weeks[0].toLocaleString("en-IN")}</td>
                                <td className="pct">{this.getPercentage(weeks[0], total)}</td>
                              </tr>
                              <tr>
                                <td className="lbl">
                                  <span className="dot" style={{ background: '#10b981' }} />
                                  Week 2 (8-14)
                                </td>
                                <td className="val">₹{weeks[1].toLocaleString("en-IN")}</td>
                                <td className="pct">{this.getPercentage(weeks[1], total)}</td>
                              </tr>
                              <tr>
                                <td className="lbl">
                                  <span className="dot" style={{ background: '#3b82f6' }} />
                                  Week 3 (15-21)
                                </td>
                                <td className="val">₹{weeks[2].toLocaleString("en-IN")}</td>
                                <td className="pct">{this.getPercentage(weeks[2], total)}</td>
                              </tr>
                                <tr>
                                  <td className="lbl">
                                    <span className="dot" style={{ background: '#8b5cf6' }} />
                                    Week 4+ (22+)
                                  </td>
                                  <td className="val">₹{weeks[3].toLocaleString("en-IN")}</td>
                                  <td className="pct">{this.getPercentage(weeks[3], total)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
    );
  }
}

export default Home;
