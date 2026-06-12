import React, { useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import Layout from "../../core/Layout";
import { bulkUploadTravels } from "../../../Utils/Requests/Travel";

function BulkUpload({ switchMode }) {
  const [state, setState] = useState({
    travels: [],
    loading: false,
    fileName: ""
  });

  const { travels, loading, fileName } = state;

  const mapRow = row => {
    const normalized = {};
    for (let key in row) {
      const normKey = key.trim().toLowerCase().replace(/[\s_-]+/g, "");
      if (normKey === "name" || normKey === "travelname" || normKey === "travel" || normKey === "agency") {
        normalized.name = row[key];
      }
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

        const parsedTravels = rawRows.map(row => mapRow(row)).filter(t => t.name);

        setState({
          travels: parsedTravels,
          fileName: file.name,
          loading: false
        });

        Swal.fire({
          type: "success",
          title: `Parsed ${parsedTravels.length} travels successfully!`,
          text: "Review the travels in the preview table below and click upload."
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
    if (travels.length === 0) {
      return Swal.fire({
        type: "warning",
        title: "No travels loaded",
        text: "Please select and load a valid Excel or CSV file first."
      });
    }

    setState({ ...state, loading: true });

    const resp = await bulkUploadTravels({ travels }).catch(err => {
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
          .map(e => `Travel '${e.name}': ${e.error}`)
          .slice(0, 5)
          .join("\n");

        Swal.fire({
          type: "warning",
          title: "Bulk Upload Completed with Warnings",
          text: `Successfully uploaded ${successCount} travels. ${errorCount} failed.`,
          html: `<div style="text-align: left;">
                  <p><b>Success count:</b> ${successCount}</p>
                  <p><b>Failed count:</b> ${errorCount}</p>
                  <p><b>Recent Errors:</b></p>
                  <pre style="background: #f8f9fa; color: #080d18; padding: 10px; border-radius: 4px; font-size: 0.85rem;">${errorList || "None"}</pre>
                 </div>`,
          onClose: () => {
            window.location.href = "/travels";
          }
        });
      } else {
        Swal.fire({
          type: "success",
          title: "Bulk Upload Complete",
          text: `Successfully uploaded all ${successCount} travels!`,
          onClose: () => {
            window.location.href = "/travels";
          }
        });
      }
    }
  };

  return (
    <Layout title="Bulk Travel Upload (Excel / CSV)">
      <div style={{ marginBottom: "1.5rem" }}>
        <button className="btn btn-secondary" onClick={switchMode} style={{ marginRight: "1rem" }}>
          <i className="fa fa-arrow-left" style={{ marginRight: "5px" }} /> Switch to Manual Add
        </button>
      </div>

      <div className="card card-default" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4>Instructions for Bulk Travel Upload</h4>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>
            Upload an Excel (`.xlsx`) or CSV (`.csv`) sheet containing your travel agency list. Make sure the sheet columns match the following headers (case and spaces are flexible):
          </p>
          <div style={{ background: "#f8f9fa", color: "#080d18", padding: "10px", borderRadius: "4px", fontSize: "0.88rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
            <div><b>Name</b> (e.g. VOLVO EXPRESS)</div>
          </div>
        </div>

        <hr />

        <div style={{ marginTop: "1rem" }}>
          <label className="btn btn-primary" style={{ display: "inline-block", cursor: "pointer", padding: "0.8rem 1.5rem", borderRadius: "4px" }}>
            <i className="fa fa-file-excel-o" style={{ marginRight: "8px" }} /> {fileName ? `Selected: ${fileName}` : "Choose Excel / CSV File"}
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} style={{ display: "none" }} />
          </label>
          {fileName && (
            <button className="btn btn-warning" onClick={handleUpload} style={{ marginLeft: "1rem", padding: "0.8rem 1.5rem" }} disabled={loading}>
              {loading ? "Uploading..." : `Upload ${travels.length} Travels`}
            </button>
          )}
        </div>
      </div>

      {travels.length > 0 && (
        <div className="card card-default" style={{ padding: "1.5rem" }}>
          <h4>Previewing Travels ({travels.length} rows)</h4>
          <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="table table-bordered table-striped" style={{ fontSize: "0.88rem" }}>
              <thead>
                <tr>
                  <th>S.N</th>
                  <th>Travel Name</th>
                </tr>
              </thead>
              <tbody>
                {travels.map((t, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{t.name || "N/A"}</td>
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
