import React, { Component } from "react";
import Swal from "sweetalert2";

class SeatDetails extends Component {
  state = {
    rows: [],
  };

  componentDidMount() {
    if (this.props.numberOfSeats) {
      const totalSeats = this.props.numberOfSeats;
      const seatsPerRow = 4; // 2 left (A) + 2 right (B)
      const totalRows = Math.ceil(totalSeats / seatsPerRow);
      let rows = [];
      let aNum = 1;
      let bNum = 1;

      for (let r = 0; r < totalRows; r++) {
        let row = { left: [], right: [] };
        // Left side: 2 A seats per row
        if (aNum <= Math.ceil(totalSeats / 2)) {
          row.left.push("A" + aNum);
          aNum++;
        }
        if (aNum <= Math.ceil(totalSeats / 2)) {
          row.left.push("A" + aNum);
          aNum++;
        }
        // Right side: 2 B seats per row
        if (bNum <= Math.ceil(totalSeats / 2)) {
          row.right.push("B" + bNum);
          bNum++;
        }
        if (bNum <= Math.ceil(totalSeats / 2)) {
          row.right.push("B" + bNum);
          bNum++;
        }
        rows.push(row);
      }
      this.setState({ rows });
    }
  }

  handleClick = (seat) => {
    if (this.props.onSeatClick) {
      this.props.onSeatClick(seat);
    }
  };

  getSeatStyle = (seat) => {
    if (!seat) return styles.emptySlot;
    const { sold, booked, selectedSeats = [], femaleSeats = [], selectedByOthers = [] } = this.props;
    if (selectedByOthers.includes(seat)) return styles.selectedByOthersButton;
    if (femaleSeats.includes(seat)) return styles.femaleBookedButton;
    if (sold.includes(seat)) return styles.soldButton;
    if (booked.includes(seat)) return styles.bookedButton;
    if (selectedSeats.includes(seat)) return styles.selectedButton;
    return styles.availableButton;
  };

  isSeatDisabled = (seat) => {
    if (!seat) return true;
    const { sold, booked, femaleSeats = [], selectedByOthers = [] } = this.props;
    return sold.includes(seat) || booked.includes(seat) || femaleSeats.includes(seat) || selectedByOthers.includes(seat);
  };

  render() {
    const { rows } = this.state;
    return (
      <div style={styles.container}>
        <div style={styles.busBody}>
          {/* Steering / Driver Area */}
          <div style={styles.driverArea}>
            <img style={styles.img} src="/static/img/steer.png" alt="steering" />
            <span style={styles.driverLabel}>Driver</span>
          </div>

          {/* Seat Rows */}
          <div style={styles.seatsContainer}>
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} style={styles.seatRow}>
                {/* Left pair */}
                <div style={styles.seatPair}>
                  {row.left.map((seat) => (
                    <button
                      key={seat}
                      style={this.getSeatStyle(seat)}
                      disabled={this.isSeatDisabled(seat)}
                      onClick={() => this.handleClick(seat)}
                    >
                      {seat}
                    </button>
                  ))}
                </div>

                {/* Aisle */}
                <div style={styles.aisle}></div>

                {/* Right pair */}
                <div style={styles.seatPair}>
                  {row.right.map((seat) => (
                    <button
                      key={seat}
                      style={this.getSeatStyle(seat)}
                      disabled={this.isSeatDisabled(seat)}
                      onClick={() => this.handleClick(seat)}
                    >
                      {seat}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "1rem 0",
    gap: "1.5rem",
  },
  busBody: {
    background: "rgba(13, 21, 38, 0.65)",
    border: "2px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "20px 20px 12px 12px",
    padding: "0",
    minWidth: "280px",
    maxWidth: "340px",
    width: "100%",
    overflow: "hidden",
  },
  driverArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.5rem",
    borderBottom: "2px solid rgba(255, 255, 255, 0.06)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  img: {
    height: "2.5rem",
    transform: "rotate(90deg)",
    opacity: 0.5,
  },
  driverLabel: {
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.35)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "600",
  },
  seatsContainer: {
    padding: "1rem 1.2rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  seatRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seatPair: {
    display: "flex",
    gap: "0.4rem",
  },
  aisle: {
    width: "2.5rem",
    flexShrink: 0,
  },
  availableButton: {
    background: "linear-gradient(135deg, #00BCD4, #0097a7)",
    color: "#ffffff",
    margin: "0.2rem",
    minWidth: "48px",
    height: "36px",
    fontWeight: "700",
    fontSize: "0.78rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(0, 188, 212, 0.25)",
  },
  selectedButton: {
    background: "linear-gradient(135deg, #a855f7, #ec4899)",
    color: "#ffffff",
    margin: "0.2rem",
    minWidth: "48px",
    height: "36px",
    fontWeight: "700",
    fontSize: "0.78rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(168, 85, 247, 0.4)",
  },
  selectedByOthersButton: {
    background: "#fadb14",
    color: "#000000",
    margin: "0.2rem",
    minWidth: "48px",
    height: "36px",
    fontWeight: "700",
    fontSize: "0.78rem",
    borderRadius: "8px",
    border: "none",
    cursor: "not-allowed",
    boxShadow: "0 2px 8px rgba(250, 219, 20, 0.4)",
  },
  bookedButton: {
    background: "rgba(255, 255, 255, 0.15)",
    color: "rgba(255, 255, 255, 0.4)",
    margin: "0.2rem",
    minWidth: "48px",
    height: "36px",
    fontWeight: "700",
    fontSize: "0.78rem",
    borderRadius: "8px",
    border: "none",
    cursor: "not-allowed",
  },
  femaleBookedButton: {
    background: "linear-gradient(135deg, #f472b6, #db2777)",
    color: "#ffffff",
    margin: "0.2rem",
    minWidth: "48px",
    height: "36px",
    fontWeight: "700",
    fontSize: "0.78rem",
    borderRadius: "8px",
    border: "none",
    cursor: "not-allowed",
    boxShadow: "0 2px 8px rgba(244, 114, 182, 0.4)",
  },
  soldButton: {
    background: "#ef4444",
    color: "#ffffff",
    margin: "0.2rem",
    minWidth: "48px",
    height: "36px",
    fontWeight: "700",
    fontSize: "0.78rem",
    borderRadius: "8px",
    border: "none",
    cursor: "not-allowed",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
  },
  emptySlot: {
    visibility: "hidden",
    margin: "0.2rem",
    minWidth: "48px",
    height: "36px",
  },
};

export default SeatDetails;
