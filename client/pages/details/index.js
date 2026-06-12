import Layout from "../../components/Layout";
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  AutoComplete,
  InputNumber,
  Button
} from "antd";
import Swal from "sweetalert2";
import Router from "next/router";
import { dec } from "../../utils/encdec";
import { postBookSeat, getMyBookingsApi } from "../../actions/book";
import { getAuthToken, getUserProfileApi } from "../../utils/auth";
const { Option } = Select;

class Details extends React.Component {
  state = {
    dataSource: [],
    passengers: [],
    address: "",
    phone: "",
    email: "",
    promoCode: "",
    discount: 0,
    appliedPromo: "",
    wallet: null,
    payWithWallet: false,
    journeyDate: ""
  };

  componentDidMount() {
    const seatList = this.getSeatList();
    const passengers = seatList.map(seat => ({
      seat,
      name: "",
      email: "",
      phone: "",
      gender: "male"
    }));
    this.setState({ passengers });
    this.fetchUserWallet();
    window.addEventListener("auth-changed", this.fetchUserWallet);
  }

  componentWillUnmount() {
    window.removeEventListener("auth-changed", this.fetchUserWallet);
  }

  fetchUserWallet = async () => {
    const token = getAuthToken();
    if (!token) {
      this.setState({ wallet: null, payWithWallet: false });
      return;
    }
    try {
      const profile = await getUserProfileApi(token);
      if (profile && typeof profile.wallet !== "undefined") {
        this.setState({ wallet: profile.wallet });
      }
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    }
  };

  getSeatList = () => {
    return this.props.seat ? this.props.seat.split(",") : [];
  };

  handleAutoComplete = value => {
    this.setState({
      dataSource:
        !value || value.indexOf("@") >= 0
          ? []
          : [
              `${value}@gmail.com`,
              `${value}@hotmail.com`,
              `${value}@yahoo.com`
            ],
      email: value
    });
  };

  handleChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handlePromoChange = e => {
    this.setState({ promoCode: e.target.value });
  };

  applyPromoCode = async () => {
    const { promoCode } = this.state;
    const code = promoCode.trim().toUpperCase();
    const journeyDate = this.state.journeyDate || this.props.journeyDate;
    const numSeats = this.getSeatList().length;
    const baseTotal = this.props.fare * numSeats;

    if (code === "FIRST100") {
      const token = getAuthToken();
      if (!token) {
        Swal.fire("Error", "You must be signed in to use this promo code!", "error");
        return;
      }
      try {
        const bookings = await getMyBookingsApi(token);
        if (bookings && !bookings.error && bookings.length > 0) {
          Swal.fire("Error", "You have already made bookings in the past. The FIRST100 promo code is only valid for your first ride booking!", "error");
          return;
        }
      } catch (err) {
        console.error("Error checking promo code usage:", err);
      }

      this.setState({ discount: 100, appliedPromo: "FIRST100" });
      Swal.fire("Success!", "Promo code applied! ₹100 discount applied to your total cost.", "success");
    } else if (code === "WEEKEND20") {
      if (journeyDate) {
        const dateObj = new Date(journeyDate);
        const day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
        if (day === 0 || day === 6) {
          const discountVal = Math.round(baseTotal * 0.2);
          this.setState({ discount: discountVal, appliedPromo: "WEEKEND20 (20%)" });
          Swal.fire("Success!", "Weekend promo applied! 20% discount applied to your total cost.", "success");
        } else {
          Swal.fire("Error", "This promo code is only valid for weekend journeys (Saturday or Sunday)!", "error");
        }
      } else {
        Swal.fire("Error", "Journey date is not set!", "error");
      }
    } else if (code === "GROUP15") {
      if (numSeats >= 4) {
        const discountVal = Math.round(baseTotal * 0.15);
        this.setState({ discount: discountVal, appliedPromo: "GROUP15 (15%)" });
        Swal.fire("Success!", "Group booking promo applied! 15% discount applied to your total cost.", "success");
      } else {
        Swal.fire("Error", "This promo code is only valid for group bookings of 4 or more seats!", "error");
      }
    } else {
      this.setState({ discount: 0, appliedPromo: "" });
      Swal.fire("Error", "Invalid promo code!", "error");
    }
  };

  handleNumber = value => {
    this.setState({ phone: value });
  };

  handlePassengerChange = (index, field, value) => {
    const passengers = [...this.state.passengers];
    passengers[index][field] = value;
    this.setState({ passengers });
  };

  handleSubmit = async () => {
    if (!getAuthToken()) {
      Swal.fire({
        title: "Sign In Required",
        text: "Please sign in or sign up to complete your booking reservation.",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#00BCD4",
        cancelButtonColor: "#ef4444",
        confirmButtonText: "Sign In / Sign Up",
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.value) {
          if (window.showAuthModal) {
            window.showAuthModal(() => {
              // Successfully signed in, fetch wallet to update UI
              this.fetchUserWallet();
            });
          }
        }
      });
      return;
    }

    const { passengers = [], address, phone, email, payWithWallet, wallet, discount, journeyDate } = this.state;
    if (!journeyDate && !this.props.journeyDate) {
      return Swal.fire("Error", "Please select a Journey Date!", "error");
    }
    if (!address) {
      return Swal.fire("Error", "Please fill the Current Address!", "error");
    }
    if (!phone) {
      return Swal.fire("Error", "Please fill the Primary Mobile number!", "error");
    }
    if (passengers.length === 0) {
      return Swal.fire("Error", "No passenger selected!", "error");
    }
    // Verify all passenger details are filled
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].name) {
        return Swal.fire("Error", `Please fill the name for Passenger on Seat ${passengers[i].seat}`, "error");
      }
      if (!passengers[i].email) {
        return Swal.fire("Error", `Please fill the email for Passenger on Seat ${passengers[i].seat}`, "error");
      }
      if (!passengers[i].phone) {
        return Swal.fire("Error", `Please fill the mobile number for Passenger on Seat ${passengers[i].seat}`, "error");
      }
    }

    // Gender check against already booked female seats
    const femaleSeats = this.props.femaleSeats || [];
    const getAdjacentSeat = (seat) => {
      if (!seat) return null;
      const match = seat.match(/^([A-Za-z]+)(\d+)$/);
      if (!match) return null;
      const prefix = match[1];
      const num = parseInt(match[2], 10);
      const adjNum = num % 2 === 0 ? num - 1 : num + 1;
      return prefix + adjNum;
    };

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (p.gender !== "female") {
        const adj = getAdjacentSeat(p.seat);
        if (adj && femaleSeats.includes(adj)) {
          return Swal.fire(
            "Gender Constraint",
            `Seat ${p.seat} cannot be booked by a male/other passenger because adjacent seat ${adj} is reserved for a female passenger.`,
            "error"
          );
        }
      }
    }

    const numSeats = passengers.length;
    const baseTotal = this.props.fare * numSeats;
    const totalCost = baseTotal - discount;

    if (payWithWallet) {
      if (wallet === null || wallet < totalCost) {
        return Swal.fire("Error", "Insufficient wallet balance to complete this booking!", "error");
      }
    }

    let success = true;
    const token = getAuthToken();
    const pricePerSeat = totalCost / numSeats;

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const passengerPhone = p.phone || phone;
      const passengerEmail = p.email || email || "traveler@yatramitra.com";
      const finalJourneyDate = journeyDate || this.props.journeyDate;
      const info = {
        name: p.name,
        phone: passengerPhone,
        address,
        email: passengerEmail,
        seatNumber: p.seat,
        gender: p.gender,
        journeyDate: finalJourneyDate,
        promoCode: this.state.appliedPromo,
        numSeats: passengers.length
      };
      
      if (payWithWallet) {
        info.payWithWallet = true;
        info.price = pricePerSeat;
      }

      const resp = await postBookSeat(this.props.slug, info, token);
      if (resp && resp.error) {
        success = false;
        break;
      }
    }

    if (success) {
      if (payWithWallet) {
        window.dispatchEvent(new Event("wallet-updated"));
      }
      this.sweetAlert("success");
    } else {
      this.sweetAlert("error");
    }
  };

  sweetAlert = status => {
    setTimeout(() => {
      if(status !== "error"){
        Router.push("/dashboard");
      }
    }, 1000);

    if (status === "error") {
      return Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!"
      });
    } else {
      Swal.fire("Congrats!", "Your seat is booked", "success");
    }
  };

  renderPassengersForm = () => {
    const { passengers = [] } = this.state;
    return passengers.map((p, index) => (
      <Card
        title={`Passenger Details - Seat ${p.seat}`}
        style={{ width: "100%", marginBottom: "1.5rem" }}
        key={p.seat}
      >
        <Input.Group>
          <h4>Passenger Name *</h4>
          <Input
            value={p.name}
            onChange={e => this.handlePassengerChange(index, "name", e.target.value)}
            placeholder="Enter passenger name"
          />
        </Input.Group>
        <br />
        <Input.Group>
          <h4>Gender *</h4>
          <Select
            value={p.gender || "male"}
            style={{ width: "100%" }}
            onChange={value => this.handlePassengerChange(index, "gender", value)}
          >
            <Option value="male">Male</Option>
            <Option value="female">Female</Option>
            <Option value="other">Other</Option>
          </Select>
        </Input.Group>
        <br />
        <Input.Group>
          <h4>Email *</h4>
          <Input
            value={p.email}
            onChange={e => this.handlePassengerChange(index, "email", e.target.value)}
            placeholder="Enter passenger email"
          />
        </Input.Group>
        <br />
        <Input.Group>
          <h4>Mobile *</h4>
          <Input
            value={p.phone}
            onChange={e => this.handlePassengerChange(index, "phone", e.target.value)}
            placeholder="Enter passenger mobile number"
          />
        </Input.Group>
      </Card>
    ));
  };

  render() {
    return (
      <Layout>
        <Row className="row-container">
          <Col span={3}></Col>
          <Col span={10}>
            {this.renderPassengersForm()}
            
            <Card title="Common Details & Boarding" style={{ width: "100%" }}>
              <Input.Group>
                <h4>Journey Date *</h4>
                <Input
                  type="date"
                  onChange={this.handleChange}
                  name="journeyDate"
                  min={new Date().toISOString().split("T")[0]}
                  style={{ width: "100%" }}
                  value={this.state.journeyDate}
                />
              </Input.Group>
              <br />
              <Input.Group>
                <h4>Current Address *</h4>
                <Input onChange={this.handleChange} name="address" />
              </Input.Group>
              <br />
              <Row>
                <Col span={11}>
                  <Input.Group>
                    <h4>Primary Mobile *</h4>
                    <InputNumber
                      style={{ width: "100%" }}
                      onChange={this.handleNumber}
                      name="phone"
                    />
                  </Input.Group>
                </Col>
                <Col span={2}></Col>
                <Col span={11}>
                  <Input.Group>
                    <h4>Boarding Point: </h4>
                    <Select defaultValue="Buspark" style={{ width: "100%" }}>
                      <Option disabled value="Buspark">
                        Buspark
                      </Option>
                      <Option disabled value="Attariya">
                        Attariya
                      </Option>
                    </Select>
                  </Input.Group>
                </Col>
              </Row>
              <br />
              <Button
                type="primary"
                style={{ width: "100%" }}
                onClick={this.handleSubmit}
              >
                Proceed to Confirmation
              </Button>
            </Card>
          </Col>
          <Col span={1}></Col>
          <Col span={6}>
            <Card title="Travel Details" style={{ width: "100%" }}>
              <p>
                <b>Route: </b>
                {this.props.start} - {this.props.end}
              </p>
              <p>
                <b>Date: </b>
                {this.state.journeyDate || this.props.journeyDate || "Not selected yet"}
              </p>
              <p>
                <b>Seats: </b>
                {this.getSeatList().join(", ")}
              </p>
              <p>
                <b>Travel: </b>
                {this.props.travelName}
              </p>
            </Card>

            <br />
            <Card title="Payment Details" style={{ width: "100%" }}>
              <p>
                <b>Per Ticket Cost: </b>Rs. {this.props.fare}
              </p>
              <p>
                <b>Number of Seats: </b>{this.getSeatList().length}
              </p>
              {this.state.discount > 0 && (
                <p style={{ color: "#22c55e" }}>
                  <b>Discount (Promo: {this.state.appliedPromo}): </b>- Rs. {this.state.discount}
                </p>
              )}
              <p>
                <b>Total Cost: </b>Rs. {(this.props.fare * this.getSeatList().length) - this.state.discount}
              </p>
              <br />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Input
                  placeholder="Enter promo code"
                  value={this.state.promoCode}
                  onChange={this.handlePromoChange}
                  style={{ textTransform: "uppercase" }}
                />
                <Button type="primary" onClick={this.applyPromoCode}>
                  Apply
                </Button>
              </div>
              {this.state.wallet !== null ? (
                <div style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span><b>Available Wallet Balance:</b></span>
                    <span style={{ color: "#00BCD4", fontWeight: "bold" }}>₹{this.state.wallet}</span>
                  </div>
                  <label className="wallet-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginTop: "0.75rem" }}>
                    <input
                      type="checkbox"
                      checked={this.state.payWithWallet}
                      onChange={e => this.setState({ payWithWallet: e.target.checked })}
                      style={{ width: "16px", height: "16px", accentColor: "#00BCD4" }}
                    />
                    <span>Pay using YatraMitra Wallet</span>
                  </label>
                  {this.state.payWithWallet && (
                    <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: this.state.wallet >= ((this.props.fare * this.getSeatList().length) - this.state.discount) ? "#22c55e" : "#ef4444" }}>
                      {this.state.wallet >= ((this.props.fare * this.getSeatList().length) - this.state.discount) ? (
                        "✓ Sufficient balance. Your booking will be instantly confirmed!"
                      ) : (
                        "✗ Insufficient balance! Please add funds or uncheck to pay normally."
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ marginTop: "1rem", fontSize: "0.9rem", opacity: 0.8 }}>
                  <i>Log in to pay using your YatraMitra Wallet.</i>
                </p>
              )}
            </Card>
          </Col>
          <Col span={4}></Col>
        </Row>
      </Layout>
    );
  }
}

Details.getInitialProps = ({ query }) => {
  const info = dec(query.info);
  if (info) {
    return info;
  }
  return {};
};

export default Details;
