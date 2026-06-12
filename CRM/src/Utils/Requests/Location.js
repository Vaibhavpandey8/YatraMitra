import axios from "axios";

export const getAllLocations = () => axios.get("/locations");
export const getALocation = id => axios.get(`/locations/${id}`);
export const updateLocation = (id, body) => axios.put(`/locations/${id}`, body);
export const removeLocation = id => axios.delete(`/locations/${id}`);
export const addNewLocation = body => axios.post("/locations", body);
export const removeAllLocations = () => axios.delete("/locations");
export const bulkUploadLocations = body => axios.post("/locations/bulk-upload", body);
