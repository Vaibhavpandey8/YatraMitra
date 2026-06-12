import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import Layout from "../../core/Layout";
import { SERVER_ROUTE } from "../../../Utils/config";


function BulkUpload({ switchMode }) {
  const [state, setState] = useState({
    buses: [],
    loading: false,
    fileName: ""
  });

  const { buses, loading, fileName } = state;

  const mapRow = row => {
    const normalized = {};
    for (let key in row) {
      const normKey = key.trim().toLowerCase().replace(/[\s_-]+/g, "");
      if (normKey === "name" || normKey === "busname") normalized.name = row[key];
      else if (normKey === "type" || normKey === "bustype") normalized.type = row[key];
      else if (normKey === "busnumber" || normKey === "number") normalized.busNumber = String(row[key]);
      else if (normKey === "fare" || normKey === "price") normalized.fare = Number(row[key]);
      else if (normKey === "features") normalized.features = row[key];
      else if (normKey === "description") normalized.description = row[key];
      else if (normKey === "numberofseats" || normKey === "seats" || normKey === "capacity") normalized.numberOfSeats = Number(row[key]);
      else if (normKey === "departuretime" || normKey === "departure") normalized.departure_time = row[key];
      else if (normKey === "journeydate" || normKey === "date") normalized.journeyDate = String(row[key]);
      else if (normKey === "startlocation" || normKey === "start" || normKey === "from") normalized.startLocation = row[key];
      else if (normKey === "endlocation" || normKey === "end" || normKey === "to") normalized.endLocation = row[key];
      else if (normKey === "travel" || normKey === "travels" || normKey === "agency" || normKey === "operator") normalized.travel = row[key];
      else if (normKey === "boardingpoints" || normKey === "boarding") normalized.boardingPoints = row[key];
      else if (normKey === "droppingpoints" || normKey === "dropping") normalized.droppingPoints = row[key];
      else if (normKey === "image" || normKey === "busimage" || normKey === "photo" || normKey === "picture") normalized.image = row[key] ? String(row[key]) : "";
    }
    return normalized;
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;

    setState({ ...state, fileName: file.name, loading: true });

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawRows = XLSX.utils.sheet_to_json(ws);

        const parsedBuses = rawRows.map(row => mapRow(row));

        setState({
          buses: parsedBuses,
          fileName: file.name,
          loading: false
        });

        Swal.fire({
          type: "success",
          title: `Parsed ${parsedBuses.length} buses successfully!`,
          text: "Review the buses in the preview table below and click upload."
        });
      } catch (err) {
        setState({ ...state, loading: false, fileName: "" });
        Swal.fire({
          type: "error",
          title: "Failed to parse file",
          text: "Please make sure you uploaded a valid Excel or CSV file."
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    if (buses.length === 0) {
      return Swal.fire({
        type: "warning",
        title: "No buses loaded",
        text: "Please select and load a valid Excel or CSV file first."
      });
    }

    setState({ ...state, loading: true });

    const resp = await axios.post("/bus/bulk-upload", { buses }).catch(err => {
      setState({ ...state, loading: false });
      Swal.fire({
        type: "error",
        title: "Bulk upload failed",
        text: err.response && err.response.data && err.response.data.error 
          ? err.response.data.error 
          : "Something went wrong during upload."
      });
    });

    if (resp && resp.status === 200) {
      setState({ ...state, loading: false });
      const { successCount, errorCount, errors } = resp.data;

      if (errorCount > 0) {
        const errorList = errors
          .map(e => `Bus #${e.busNumber}: ${e.error}`)
          .slice(0, 5)
          .join("\n");

        Swal.fire({
          type: "warning",
          title: "Bulk Upload Completed with Warnings",
          text: `Successfully uploaded ${successCount} buses. ${errorCount} failed.`,
          html: `<div style="text-align: left;">
                  <p><b>Success count:</b> ${successCount}</p>
                  <p><b>Failed count:</b> ${errorCount}</p>
                  <p><b>Recent Errors:</b></p>
                  <pre style="background: #f8f9fa; color: #080d18; padding: 10px; border-radius: 4px; font-size: 0.85rem;">${errorList || "None"}</pre>
                 </div>`,
          onClose: () => {
            window.location.href = "/bus-available";
          }
        });
      } else {
        Swal.fire({
          type: "success",
          title: "Bulk Upload Complete",
          text: `Successfully uploaded all ${successCount} buses!`,
          onClose: () => {
            window.location.href = "/bus-available";
          }
        });
      }
    }
  };

  return (
    <Layout title="Bulk Bus Upload (Excel / CSV)">
      <div style={{ marginBottom: "1.5rem" }}>
        <button className="btn btn-secondary" onClick={switchMode} style={{ marginRight: "1rem" }}>
          <i className="fa fa-arrow-left" style={{ marginRight: "5px" }} /> Switch to Manual Add
        </button>
      </div>

      <div className="card card-default" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4>Instructions for Bulk Upload</h4>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>
            Upload an Excel (`.xlsx`) or CSV (`.csv`) sheet containing your bus list. Make sure the sheet columns match the following headers (case and spaces are flexible):
          </p>
          <div style={{ background: "#f8f9fa", color: "#080d18", padding: "10px", borderRadius: "4px", fontSize: "0.88rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
            <div><b>Name</b> (e.g. Express AC)</div>
            <div><b>Bus Number</b> (e.g. BA-2-PA-112)</div>
            <div><b>Type</b> (AC, Delux, Normal)</div>
            <div><b>Fare</b> (e.g. 1200)</div>
            <div><b>Seats</b> (e.g. 35)</div>
            <div><b>Date</b> (e.g. 2026-06-15)</div>
            <div><b>Departure</b> (e.g. 08:30 AM)</div>
            <div><b>From</b> (Start location name)</div>
            <div><b>To</b> (End location name)</div>
            <div><b>Travel</b> (Agency operator name)</div>
            <div><b>Features</b> (Wifi, AC)</div>
            <div><b>Boarding</b> (Comma separated)</div>
            <div><b>Dropping</b> (Comma separated)</div>
            <div><b>Image</b> (URL or local path)</div>
          </div>
        </div>

        <hr />

        <div style={{ marginTop: "1rem" }}>
          <label className="btn btn-primary" style={{ display: "inline-block", cursor: "pointer", padding: "0.8rem 1.5rem", borderRadius: "4px" }}>
            <i className="fa fa-file-excel-o" style={{ marginRight: "8px" }} /> {fileName ? `Selected: ${fileName}` : "Choose Excel / CSV File"}
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} style={{ display: "none" }} />
          </label>
          {fileName && (
            <button className="btn btn-success" onClick={handleUpload} style={{ marginLeft: "1rem", padding: "0.8rem 1.5rem" }} disabled={loading}>
              {loading ? "Uploading..." : `Upload ${buses.length} Buses`}
            </button>
          )}
        </div>
      </div>

      {buses.length > 0 && (
        <div className="card card-default" style={{ padding: "1.5rem" }}>
          <h4>Previewing Buses ({buses.length} rows)</h4>
          <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="table table-bordered table-striped" style={{ fontSize: "0.88rem" }}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Bus Name</th>
                  <th>Number</th>
                  <th>Type</th>
                  <th>Fare</th>
                  <th>Seats</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Travel Agency</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((bus, idx) => (
                  <tr key={idx}>
                    <td>
                      {bus.image ? (
                        <img 
                          src={bus.image.startsWith("http://") || bus.image.startsWith("https://") ? bus.image : `${SERVER_ROUTE}/uploads/${bus.image}`} 
                          alt="preview" 
                          style={{ width: "50px", height: "30px", objectFit: "cover", borderRadius: "2px" }}
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/50x30?text=No+Img"; }}
                        />
                      ) : (
                        <img 
                          src="https://via.placeholder.com/50x30?text=No+Img" 
                          alt="placeholder" 
                          style={{ width: "50px", height: "30px", objectFit: "cover", borderRadius: "2px" }}
                        />
                      )}
                    </td>
                    <td>{bus.name || "N/A"}</td>
                    <td>{bus.busNumber || "N/A"}</td>
                    <td>{bus.type || "Normal"}</td>
                    <td>{bus.fare || 0}</td>
                    <td>{bus.numberOfSeats || 30}</td>
                    <td>{bus.startLocation || "N/A"}</td>
                    <td>{bus.endLocation || "N/A"}</td>
                    <td>{bus.travel || "N/A"}</td>
                    <td>{bus.journeyDate || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default BulkUpload;
