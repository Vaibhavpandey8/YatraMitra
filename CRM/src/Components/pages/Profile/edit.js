import React, { Component } from "react";
import Layout from "../../core/Layout";
import Swal from "sweetalert2";
import ImageUploader from "react-images-upload";
import { updateOwner } from "../../../Utils/Requests/People";
import showError from "../../core/Error";
import showLoading from "../../core/Loading";
import {
  isAuthenticated,
  refreshToken,
  authenticate
} from "../../../Utils/Requests/Auth";
import { SERVER_ROUTE } from "../../../Utils/config";
import { defaultAdminImage } from "../../../Utils/helpers";

class EditProfile extends Component {
  state = {
    buttonStyle: "block",
    formData: "",
    oldPassword: "",
    newPassword: "",
    photo: "",
    phone: "",
    citizenshipNumber: "",
    error: "",
    loading: ""
  };

  componentDidMount() {
    const { user } = isAuthenticated();
    const formData = new FormData();
    formData.set("phone", user.phone || "");
    formData.set("citizenshipNumber", user.citizenshipNumber || "");
    this.setState({
      formData,
      phone: user.phone || "",
      citizenshipNumber: user.citizenshipNumber || ""
    });
  }

  submit = async e => {
    e.preventDefault();
    this.setState({ loading: true });
    const { oldPassword, newPassword, photo, phone, citizenshipNumber, formData } = this.state;
    if ((oldPassword && newPassword) || photo || phone || citizenshipNumber) {
      const resp = await updateOwner(
        isAuthenticated().user._id,
        formData
      ).catch(err => {
        this.setState({ loading: false, error: err.response.data.error });
      });
      if (resp && resp.status === 200) {
        let data = await refreshToken(isAuthenticated().user._id);
        if (data && data.status === 200) {
          authenticate(data, () => {
            if (isAuthenticated()) {
              this.setState({ loading: false });
            }
          });
        }
        this.setState({ loading: false });
        Swal.fire({
          type: "success",
          title: "Successfully updated the profile!",
          onRender: () => {
            this.props.history.push("/");
          }
        });
      }
    } else {
      Swal.fire({
        type: "error",
        title: "Can not submit empty form!"
      });
      this.setState({loading: false})
    }
  };

  handleChange = input => e => {
    let value;
    if (input === "photo") {
      if (e.length === 0) {
        return this.setState({ buttonStyle: "block", photo: "" });
      }

      value = e[0];
      this.setState({ buttonStyle: "none" });
    } else {
      value = e.target.value;
    }

    this.state.formData.set(input, value);

    this.setState({ [input]: value, error: "" });
  };

  render() {
    const { user } = isAuthenticated();
    const handleChange = this.handleChange;
    const { oldPassword, newPassword, phone, citizenshipNumber, error, loading } = this.state;
    return (
      <Layout title="Update Profile">
        {showError(error)}
        {showLoading(loading)}
        {!loading && (
          <>
            {/* Current Profile Info Summary */}
            <div className="current-profile-info" style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              flexWrap: "wrap"
            }}>
              <img
                src={
                  user.avatar
                    ? `${SERVER_ROUTE}/uploads/${user.avatar}`
                    : defaultAdminImage
                }
                alt="Avatar"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #f59e0b"
                }}
              />
              <div style={{ flex: 1, minWidth: "200px" }}>
                <h3 style={{ margin: "0 0 0.4rem", color: "#f8fafc", fontSize: "1.3rem", fontWeight: "700" }}>{user.name}</h3>
                <div style={{ display: "inline-block", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "12px", padding: "0.1rem 0.6rem", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.8rem" }}>
                  {user.role}
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.6)" }}>
                  <div>
                    <i className="fa fa-envelope" style={{ color: "#f59e0b", marginRight: "8px", width: "16px" }} />
                    {user.email}
                  </div>
                  <div>
                    <i className="fa fa-phone" style={{ color: "#f59e0b", marginRight: "8px", width: "16px" }} />
                    {user.phone || "Not Provided"}
                  </div>
                  <div>
                    <i className="fa fa-id-card" style={{ color: "#f59e0b", marginRight: "8px", width: "16px" }} />
                    ID: {user.citizenshipNumber || "Not Provided"}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your phone number"
                onChange={handleChange("phone")}
                value={phone}
              />
            </div>

            <div className="form-group">
              <label>Citizenship / ID Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your citizenship/ID number"
                onChange={handleChange("citizenshipNumber")}
                value={citizenshipNumber}
              />
            </div>

            <div className="form-group">
              <label>Old Password</label>
              <input
                type="password"
                className="form-control"
                required
                placeholder="Enter the old password"
                onChange={handleChange("oldPassword")}
                value={oldPassword}
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                className="form-control"
                required
                placeholder="Enter the new password"
                onChange={handleChange("newPassword")}
                value={newPassword}
              />
            </div>

            <button
              className="btn btn-success submit-form"
              onClick={this.submit}
            >
              Update Profile
            </button>

            <div className="form-group">
              <ImageUploader
                withIcon={true}
                buttonText="Upload photo"
                onChange={handleChange("photo")}
                imgExtension={[".jpg", ".jpeg", ".gif", ".png", ".gif"]}
                maxFileSize={5242880}
                singleImage={true}
                withPreview={true}
                buttonStyles={{ display: this.state.buttonStyle }}
                //   defaultImage={values.image}
              />
            </div>

            
          </>
        )}
      </Layout>
    );
  }
}

export default EditProfile;
