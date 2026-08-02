import { Card, Row, Col, Modal, Button, Tag } from "antd";
import Router from "next/router";
import SeatDetails from "./seatDetails";
import { API_ROOT } from "../../utils/config";
import { enc, dec } from "../../utils/encdec";
import io from "socket.io-client";

class SingleCard extends React.Component {
  state = {
    visible: false,
    userBooked: [],
    selectedByOthers: [],
    liveSold: [],
    liveBooked: [],
    liveFemaleSeats: []
  };

  showModal = () => {
    this.setState({
      visible: true,
      loading: false,
      selectedByOthers: [],
      liveSold: this.props.bus.soldSeat || [],
      liveBooked: this.props.bus.bookedSeat || [],
      liveFemaleSeats: this.props.bus.femaleSeats || []
    }, () => {
      this.socket = io(API_ROOT);
      this.socket.emit("join-bus-room", { slug: this.props.bus.slug });

      this.socket.on("seat-selection-broadcast", ({ seat, action }) => {
        let arr = [...this.state.selectedByOthers];
        if (action === "select") {
          if (!arr.includes(seat)) arr.push(seat);
        } else if (action === "deselect") {
          arr = arr.filter(s => s !== seat);
        }
        this.setState({ selectedByOthers: arr });
      });

      this.socket.on("seat-booked-broadcast", ({ seatNumber, gender, verification }) => {
        const { liveSold, liveBooked, liveFemaleSeats } = this.state;
        const newSold = [...liveSold];
        const newBooked = [...liveBooked];
        const newFemale = [...liveFemaleSeats];

        if (verification === "payed") {
          if (!newSold.includes(seatNumber)) newSold.push(seatNumber);
        } else {
          if (!newBooked.includes(seatNumber)) newBooked.push(seatNumber);
        }

        if (gender === "female") {
          if (!newFemale.includes(seatNumber)) newFemale.push(seatNumber);
        }

        const newSelectedByOthers = this.state.selectedByOthers.filter(s => s !== seatNumber);

        this.setState({
          liveSold: newSold,
          liveBooked: newBooked,
          liveFemaleSeats: newFemale,
          selectedByOthers: newSelectedByOthers
        });
      });

      this.socket.on("seats-reset", () => {
        this.setState({
          liveSold: [],
          liveBooked: [],
          liveFemaleSeats: [],
          selectedByOthers: [],
          userBooked: []
        });
      });
    });
  };

  toggleSelectSeat = (seat) => {
    let arr = [...this.state.userBooked];
    let action = "";
    if (arr.includes(seat)) {
      arr = arr.filter(s => s !== seat);
      action = "deselect";
    } else {
      arr.push(seat);
      action = "select";
    }
    this.setState({ userBooked: arr }, () => {
      if (this.socket) {
        this.socket.emit("seat-selection-toggle", {
          slug: this.props.bus.slug,
          seat,
          action
        });
      }
    });
  };

  confirmBooking = () => {
    const { userBooked } = this.state;
    if (userBooked.length === 0) return;
    const seatsStr = userBooked.join(",");
    this.encryptInfo(seatsStr);
  };

  closeSocket = () => {
    if (this.socket) {
      this.state.userBooked.forEach(seat => {
        this.socket.emit("seat-selection-toggle", {
          slug: this.props.bus.slug,
          seat,
          action: "deselect"
        });
      });
      this.socket.disconnect();
      this.socket = null;
    }
  };

  handleOk = (info) => {
    this.setState({ loading: true });
    this.closeSocket();
    setTimeout(() => {
      this.setState({ loading: false, visible: false, userBooked: [] });
      Router.push({
        pathname: "/details",
        query: {info}
      });
    }, 1000);
  };

  encryptInfo = seat => {
    const {startLocation, endLocation, fare, journeyDate, travel, slug} = this.props.bus;
    let start = startLocation ? startLocation.name : "";
    let end = endLocation ? endLocation.name : "";
    let travelName = travel ? travel.name : "";
    const info = {start, end, fare, journeyDate, travelName, seat, slug, femaleSeats: this.state.liveFemaleSeats}
    const resp = enc(info);
    this.handleOk(resp)
  }

  handleCancel = e => {
    this.closeSocket();
    this.setState({
      visible: false,
      userBooked: []
    });
  };

  seatColorMeaning = () => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg, #00BCD4, #0097a7)' }}></span>
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}></span>
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>Selected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px', background: '#fadb14' }}></span>
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>Selected by Others</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg, #f472b6, #db2777)' }}></span>
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>Female Reserved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.15)' }}></span>
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>Booked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px', background: '#e53935' }}></span>
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>Sold</span>
        </div>
      </div>
    );
  }

  seatModal = () => (
    <Modal
      title="Seat Details"
      visible={this.state.visible}
      onCancel={this.handleCancel}
      footer={[
        this.seatColorMeaning(),
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }} key="footer-actions">
          <Button
            type="primary"
            onClick={this.confirmBooking}
            disabled={this.state.userBooked.length === 0}
            style={{ minWidth: "180px" }}
          >
            Book Selected Seats ({this.state.userBooked.length})
          </Button>
        </div>
      ]}
      width={1000}
    >
      <SeatDetails
        sold={this.state.liveSold}
        setSold={() => {}}
        booked={this.state.liveBooked}
        setBooked={() => {}}
        slug={this.props.bus.slug}
        selectedSeats={this.state.userBooked}
        selectedByOthers={this.state.selectedByOthers}
        onSeatClick={this.toggleSelectSeat}
        numberOfSeats={this.props.bus.numberOfSeats}
        femaleSeats={this.state.liveFemaleSeats}
      />
    </Modal>
  );

  render() {
    const { bus } = this.props;
    return (
      <>
        <Card
          className="single-card"
          style={{ width: "100%", marginBottom: "1rem" }}
          onClick={this.showModal}
        >
          <Row gutter={[8, 8]} align="middle">
            <Col xs={6} sm={4} md={3}>
              <img
                src={
                  !bus.image
                    ? "/static/img/suspense.jpg"
                    : bus.image.startsWith("http://") || bus.image.startsWith("https://")
                    ? bus.image
                    : `${API_ROOT}/uploads/${bus.image}`
                }
                alt="suspense"
                className="bus-thumbnail"
                onError={(e) => { e.target.onerror = null; e.target.src = "/static/img/suspense.jpg"; }}
              />
            </Col>
            <Col xs={18} sm={8} md={5}>
              <p style={{ margin: 0, fontWeight: 600 }}>{bus.travel ? bus.travel.name : null}</p>
              {typeof bus.averageRating !== "undefined" && bus.totalRatings > 0 ? (
                <div style={{ fontSize: "0.8rem", color: "#fadb14", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                  <span>⭐ {bus.averageRating.toFixed(1)}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>({bus.totalRatings})</span>
                </div>
              ) : (
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", marginTop: "0.25rem" }}>
                  <span>No ratings yet</span>
                </div>
              )}
            </Col>
            <Col xs={12} sm={6} md={4}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>Type</p>
              <p style={{ margin: 0 }}>{bus.type}</p>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>Departure</p>
              <strong><p style={{ margin: 0 }}>{bus.departure_time}</p></strong>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>Seats</p>
              <p style={{ margin: 0 }}>{bus.seatsAvailable} seats</p>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>Fare</p>
              {bus.pricingStatus === "surge" && (
                <div>
                  <p style={{ margin: 0, textDecoration: "line-through", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.85rem" }}>Rs {bus.originalFare}</p>
                  <p style={{ margin: 0, fontWeight: "700", color: "#FF6B35" }}>Rs {bus.fare}</p>
                  <Tag color="orange" style={{ fontSize: "0.68rem", marginTop: "0.2rem", border: "1px solid #FF6B35", background: "rgba(255, 107, 53, 0.1)" }}>⚡ Surge (+10%)</Tag>
                </div>
              )}
              {bus.pricingStatus === "discount" && (
                <div>
                  <p style={{ margin: 0, textDecoration: "line-through", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.85rem" }}>Rs {bus.originalFare}</p>
                  <p style={{ margin: 0, fontWeight: "700", color: "#22c55e" }}>Rs {bus.fare}</p>
                  <Tag color="green" style={{ fontSize: "0.68rem", marginTop: "0.2rem", border: "1px solid #22c55e", background: "rgba(34, 197, 94, 0.1)" }}>🏷️ Last-Min (-15%)</Tag>
                </div>
              )}
              {(!bus.pricingStatus || bus.pricingStatus === "normal") && (
                <p style={{ margin: 0, fontWeight: "700", color: "#00BCD4" }}>Rs {bus.fare}</p>
              )}
            </Col>
          </Row>
        </Card>

        {this.state.visible && this.seatModal()}
      </>
    );
  }
}

export default SingleCard;
