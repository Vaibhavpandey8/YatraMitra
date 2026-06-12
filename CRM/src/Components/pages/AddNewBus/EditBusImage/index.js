import React, { Component } from "react";
import ImageUploader from "react-images-upload";
import Layout from "../../../core/Layout";
import Swal from "sweetalert2";
import { getBusBySlug, updateBus } from "../../../../Utils/Requests/Bus";
import { SERVER_ROUTE } from "../../../../Utils/config";
import Loading from "../../../core/Loading";

class EditBusImage extends Component {
  state = {
    loading: true,
    bus: {},
    image: "",
    newImageSelected: false,
    formData: null,
    buttonStyle: "block"
  };

  componentDidMount() {
    this.fetchBusDetails();
    this.setState({
      formData: new FormData()
    });
  }

  fetchBusDetails = async () => {
    const { slug } = this.props.match.params;
    const resp = await getBusBySlug(slug).catch(err => {
      this.setState({ error: err.response.data.error, loading: false });
    });
    if (resp && resp.status === 200) {
      this.setState({
        loading: false,
        bus: resp.data,
        image: resp.data.image
      });
    }
  };

  handleChange = (images) => {
    if (images.length === 0) {
      return this.setState({ buttonStyle: "block", newImageSelected: false });
    }

    const value = images[0];
    const formData = new FormData();
    formData.append("image", value);

    this.setState({
      formData,
      newImageSelected: true,
      buttonStyle: "none"
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { formData, newImageSelected } = this.state;
    const { slug } = this.props.match.params;

    if (!newImageSelected) {
      return Swal.fire({
        type: "error",
        title: "Please choose a new photo to upload"
      });
    }

    this.setState({ loading: true });
    const resp = await updateBus(slug, formData).catch(err => {
      this.setState({ loading: false });
      Swal.fire({
        type: "error",
        title: err.response?.data?.error || "Something went wrong!"
      });
    });

    if (resp && resp.status === 200) {
      Swal.fire({
        type: "success",
        title: "Successfully updated the bus image!"
      });
      this.props.history.push("/all-bus-available");
    }
  };

  render() {
    const { loading, image, buttonStyle, newImageSelected } = this.state;

    if (loading) {
      return (
        <Layout title="Edit Bus Image">
          <Loading />
        </Layout>
      );
    }

    const currentImageUrl = image
      ? image.startsWith("http://") || image.startsWith("https://")
        ? image
        : `${SERVER_ROUTE}/uploads/${image}`
      : "https://via.placeholder.com/300x180?text=No+Image";

    return (
      <Layout title="Edit Bus Image">
        <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px" }}>
          <div style={{ marginBottom: "20px", textAlign: "center" }}>
            <h4>Current Image:</h4>
            <img
              src={currentImageUrl}
              alt="Current Bus"
              style={{
                maxWidth: "100%",
                maxHeight: "200px",
                borderRadius: "8px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
                border: "2px solid #f59e0b"
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/300x180?text=No+Image";
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <ImageUploader
              withIcon={true}
              buttonText="Choose new photo"
              onChange={this.handleChange}
              imgExtension={[".jpg", ".jpeg", ".gif", ".png"]}
              maxFileSize={5242880}
              singleImage={true}
              withPreview={true}
              buttonStyles={{ display: buttonStyle }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className="btn btn-default"
              onClick={() => this.props.history.goBack()}
            >
              Cancel
            </button>
            <button
              className="btn btn-success"
              onClick={this.handleSubmit}
              style={{ display: newImageSelected ? "block" : "none" }}
            >
              Upload and Update Image
            </button>
          </div>
        </div>
      </Layout>
    );
  }
}

export default EditBusImage;
