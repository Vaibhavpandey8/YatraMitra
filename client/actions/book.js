import fetch from "isomorphic-unfetch";
import { API } from "../utils/config";

export const postSoldSeat = (slug, seat) =>
  axios.post(`/bookings/sold/${slug}`, { seatNumber: seat });

export const postBookSeat = async (slug, body, token) => {
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const resp = await fetch(`${API}/bookings/book/${slug}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  const response = await resp.json();
  return response;
};

export const getMyBookingsApi = async (token) => {
  const resp = await fetch(`${API}/bookings/my-bookings`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  const response = await resp.json();
  return response;
};

export const postRatingApi = async (body, token) => {
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const resp = await fetch(`${API}/bus/rate`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  const response = await resp.json();
  return response;
};
