import React, { Component } from "react";
import Layout from "../../core/Layout";
import Swal from "sweetalert2";
import showError from "../../core/Error";
import showLoading from "../../core/Loading";
import { addNewTravel } from "../../../Utils/Requests/Travel";
import BulkUpload from "./BulkUpload";

class AddTravel extends Component {
  state = {
    error: "",
    name: "",
    loading: "",
    mode: "manual"
  };

  submit = async e => {
    e.preventDefault();
    const { error, name, loading } = this.state;

    const resp = await addNewTravel({ name }).catch(err => {
      this.setState({ loading: false, error: err.response.data.error });
    });
    if (resp && resp.status === 200) {
      this.setState({ loading: false });
      Swal.fire({
        type: "success",
        title: "Successfully add new travel!",
        onRender: () => {
          this.props.history.push("/travels");
        }
      });
    }
  };

  handleChange = input => e => {
    let value = e.target.value;

    this.setState({
      [input]: value
    });
  };

  render() {
    const handleChange = this.handleChange;
    const { error, name, loading, mode } = this.state;

    if (mode === "bulk") {
      return (
        <BulkUpload switchMode={() => this.setState({ mode: "manual" })} />
      );
    }

    return (
      <Layout title="Add Travel">
        {showError(error)}
        {showLoading(loading)}
        {!loading && (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="Travel Name"
                onChange={handleChange("name")}
                value={name}
              />
            </div>

            <button
              className="btn btn-warning submit-form"
              onClick={this.submit}
              style={{ width: "240px" }}
            >
              <i className="fa fa-plus" style={{ marginRight: "5px" }} /> Add travel
            </button>
            <button
              className="btn btn-warning"
              onClick={() => this.setState({ mode: "bulk" })}
              style={{ marginLeft: "10px", width: "240px" }}
            >
              <i className="fa fa-file-excel-o" style={{ marginRight: "5px" }} /> Bulk Upload via Excel/CSV
            </button>
          </>
        )}
      </Layout>
    );
  }
}

export default AddTravel;
