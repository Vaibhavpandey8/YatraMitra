import React, { Component } from "react";
import Layout from "../../core/Layout";
import { removeBus, getAllAvailableBuses, removeAllBuses, resetBusSeats } from "../../../Utils/Requests/Bus";
import ReactDatatable from "@ashvin27/react-datatable";
import moment from "moment";
import Swal from "sweetalert2";
import { SERVER_ROUTE } from "../../../Utils/config";
import Loading from "../../core/Loading";

class BusAvailable extends Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        key: "sn",
        text: "S.N",
        className: "id",
        align: "left",
        sortable: true
      },
      {
        key: "image",
        text: "Image",
        className: "image",
        width: 100,
        align: "left",
        sortable: false,
        cell: record => {
          console.log(record);
          return (
            <>
              <img
                className="busImage"
                src={
                  !record.image
                    ? "https://via.placeholder.com/100x60?text=No+Image"
                    : record.image.startsWith("http://") || record.image.startsWith("https://")
                    ? record.image
                    : `${SERVER_ROUTE}/uploads/` + record.image
                }
                onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/100x60?text=No+Image"; }}
              />
            </>
          );
        }
      },
      {
        key: "name",
        text: "Name",
        className: "name",
        align: "left",
        sortable: true
      },
      {
        key: "busNumber",
        text: "Bus Number",
        className: "busNumber",
        align: "left",
        sortable: true
      },
      {
        key: "ownerName",
        text: "Owner Name",
        className: "ownerName",
        align: "left",
        sortable: true
      },
      {
        key: "travel",
        text: "Travel",
        className: "travel",
        align: "left",
        sortable: true
      },
      {
        key: "journeyDate",
        text: "Journey Date",
        className: "date",
        align: "left",
        sortable: true
      },
      {
        key: "departure_time",
        text: "Departure Time",
        className: "date",
        align: "left",
        sortable: true
      },
      {
        key: "action",
        text: "Action",
        className: "action",
        width: 100,
        align: "left",
        sortable: false,
        cell: record => {
          return (
            <>
              <button
                data-toggle="modal"
                data-target="#update-user-modal"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  this.props.history.push(`/edit-bus/${record.slug}`)
                }
                style={{ marginRight: "5px" }}
                title="Edit Bus Details"
              >
                <i className="fa fa-edit"></i>
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={() =>
                  this.props.history.push(`/edit-bus-image/${record.slug}`)
                }
                style={{ marginRight: "5px" }}
                title="Edit Bus Image"
              >
                <i className="fa fa-file-image-o"></i>
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => this.deleteRecord(record.slug)}
                style={{ marginRight: "5px" }}
              >
                <i className="fa fa-trash"></i>
              </button>
              <button
                className="btn btn-warning btn-sm"
                onClick={() => this.resetSeatsRecord(record.slug)}
                style={{ marginRight: "5px" }}
                title="Reset/Empty Seats"
              >
                <i className="fa fa-undo"></i>
              </button>
              <button
                className="btn btn-default btn-sm"
                onClick={() =>
                  this.props.history.push(`/seats-details/${record.slug}`)
                }
              >
                <i className="fa fa-eye" />
              </button>
            </>
          );
        }
      }
    ];

    this.config = {
      page_size: 10,
      length_menu: [10, 20, 50],
      filename: "Buses",
      no_data_text: "No bus found!",
      button: {
        excel: true,
        print: true,
        csv: true
      },
      language: {
        length_menu: "Show _MENU_ result per page",
        filter: "Filter in records...",
        info: "Showing _START_ to _END_ of _TOTAL_ records",
        pagination: {
          first: "First",
          previous: "Previous",
          next: "Next",
          last: "Last"
        }
      },
      show_length_menu: true,
      show_filter: true,
      show_pagination: true,
      show_info: true
    };

    this.state = {
      buses: [],
      isLoading: true,
      error: ""
    };
  }

  componentDidMount() {
    this.fetchAvailableBuses();
  }

  componentDidUpdate(nextProps, nextState) {
    if (nextState.buses === this.state.buses) {
      this.fetchAvailableBuses();
    }
  }

  deleteRecord = slug => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then(async result => {
      if (result.value) {
        const resp = await removeBus(slug).catch(err => {
          this.setState({ error: err.response.data.error });
        });
        if (resp && resp.status === 200) {
          Swal.fire("Deleted!", "Your file has been deleted.", "success");
          this.setState({});
        }
      }
    });
  };

  resetSeatsRecord = slug => {
    Swal.fire({
      title: "Are you sure you want to reset seats?",
      text: "This will empty all booked/sold seats and delete bookings for this bus!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, reset seats!"
    }).then(async result => {
      if (result.value) {
        this.setState({ isLoading: true });
        const resp = await resetBusSeats(slug).catch(err => {
          this.setState({ error: err.response?.data?.error || "Could not reset seats.", isLoading: false });
        });
        if (resp && resp.status === 200) {
          Swal.fire("Reset!", "All seats have been cleared for this bus.", "success");
          this.fetchAvailableBuses();
        }
      }
    });
  };


  deleteAllRecords = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will delete all buses! This action cannot be reverted.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete all!"
    }).then(async result => {
      if (result.value) {
        this.setState({ isLoading: true });
        const resp = await removeAllBuses().catch(err => {
          this.setState({ error: err.response.data.error, isLoading: false });
        });
        if (resp && resp.status === 200) {
          Swal.fire("Deleted!", `${resp.data.count || 0} buses have been deleted.`, "success");
          this.setState({ buses: [], isLoading: false });
        }
      }
    });
  };

  fetchAvailableBuses = async () => {
    const buses = await getAllAvailableBuses().catch(err => {
      this.setState({ error: err.response.data.error, isLoading: false });
    });
    if (buses && buses.status === 200) {
      let counter = 1;
      buses.data.map(bus => {
        bus.journeyDate = moment(bus.journeyDate).format("MMMM Do, YYYY");
        bus.sn = counter;
        counter++;
        bus.ownerName = bus.owner ? bus.owner.name : "N/A";
        bus.travel = bus.travel ? bus.travel.name : "N/A";
        return bus;
      });
      this.setState({ buses: buses.data, isLoading: false });
    }
  };

  pageChange = pageData => {
    console.log("OnPageChange", pageData);
  };

  render() {
    return (
      <Layout title="All Buses > Available buses">
        <div className="d-flex" id="wrapper">
          <div id="page-content-wrapper">
            <div className="container-fluid">
              <button className="btn btn-link mt-3" id="menu-toggle"></button>
              <h1 className="mt-2 text-primary">All Available Buses</h1>
              {this.state.isLoading ? (
                <Loading />
              ) : (
                <ReactDatatable
                  config={this.config}
                  records={this.state.buses}
                  columns={this.columns}
                  onPageChange={this.pageChange}
                />
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export default BusAvailable;
