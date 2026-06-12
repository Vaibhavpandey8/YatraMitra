import React, { Component } from "react";
import { postSoldSeat } from "../../../Utils/Requests/Booking";
import Swal from "sweetalert2";

class SeatDetails extends Component {
  state = {
    rows: [],
  };

  handleClick = async (seat) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Seats sold !",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!",
    }).then(async (result) => {
      if (result.value) {
        this.props.setSold([...this.props.sold, seat]);
        await postSoldSeat(this.props.slug, seat);
      }
    });
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

  getSeatStyle = (seat) => {
    if (!seat) return styles.emptySlot;
    const { sold, booked } = this.props;
    if (sold.includes(seat)) return styles.soldButton;
    if (booked.includes(seat)) return styles.bookedButton;
    return styles.availableButton;
  };

  isSeatDisabled = (seat) => {
    if (!seat) return true;
    const { sold, booked } = this.props;
    return sold.includes(seat) || booked.includes(seat);
  };

  render() {
    const { rows } = this.state;
    return (
      <div style={styles.container}>
        {/* Legend */}
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "#f59e0b" }}></span>
            <span>Available</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "#22c55e" }}></span>
            <span>Booked</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "#ef4444" }}></span>
            <span>Sold</span>
          </div>
        </div>

        {/* Bus Body */}
        <div style={styles.busBody}>
          {/* Steering / Driver Area */}
          <div style={styles.driverArea}>
            <i className="fa fa-circle-o" style={styles.steeringIcon}></i>
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
                      className="btn btn-sm"
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
                      className="btn btn-sm"
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
    padding: "2rem 0",
    gap: "1.5rem",
  },
  legend: {
    display: "flex",
    gap: "1.5rem",
    padding: "0.8rem 1.5rem",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.7)",
  },
  legendDot: {
    width: "12px",
    height: "12px",
    borderRadius: "3px",
    display: "inline-block",
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
    justifyContent: "flex-end",
    gap: "0.5rem",
    padding: "1rem 1.5rem",
    borderBottom: "2px solid rgba(255, 255, 255, 0.06)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  steeringIcon: {
    fontSize: "1.5rem",
    color: "rgba(255, 255, 255, 0.4)",
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
    background: "#f59e0b",
    color: "#080d18",
    margin: "0.2rem",
    minWidth: "52px",
    fontWeight: "700",
    fontSize: "0.78rem",
    borderRadius: "8px",
    border: "none",
    padding: "0.45rem 0.6rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(245, 158, 11, 0.25)",
  },
  bookedButton: {
    background: "#22c55e",
    color: "#ffffff",
    margin: "0.2rem",
    minWidth: "52px",
    fontWeight: "700",
    fontSize: "0.78rem",
    borderRadius: "8px",
    border: "none",
    padding: "0.45rem 0.6rem",
    cursor: "not-allowed",
    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.25)",
  },
  soldButton: {
    background: "#ef4444",
    color: "#ffffff",
    margin: "0.2rem",
    minWidth: "52px",
    fontWeight: "700",
    fontSize: "0.78rem",
    borderRadius: "8px",
    border: "none",
    padding: "0.45rem 0.6rem",
    cursor: "not-allowed",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
  },
  emptySlot: {
    visibility: "hidden",
    margin: "0.2rem",
    minWidth: "52px",
    padding: "0.45rem 0.6rem",
  },
};

export default SeatDetails;
