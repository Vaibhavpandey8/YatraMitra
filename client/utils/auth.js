import fetch from "isomorphic-unfetch";
import { API } from "./config";

export const signupUser = async (name, email, password, phone, referredByCode) => {
  const body = { name, email, password };
  if (phone) {
    body.phone = Number(phone);
  }
  if (referredByCode) {
    body.referredByCode = referredByCode.toUpperCase().trim();
  }
  const resp = await fetch(`${API}/auth-user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return await resp.json();
};

export const signinUser = async (email, password) => {
  const resp = await fetch(`${API}/auth-user/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return await resp.json();
};

export const socialLoginUser = async (name, email, photo, referredByCode) => {
  const body = { name, email };
  if (photo) body.photo = photo;
  if (referredByCode) body.referredByCode = referredByCode.toUpperCase().trim();
  const resp = await fetch(`${API}/auth-user/social-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return await resp.json();
};

export const generateOtpApi = async (email) => {
  const resp = await fetch(`${API}/auth-user/generate-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return await resp.json();
};

export const verifyOtpApi = async (email, otp) => {
  const resp = await fetch(`${API}/auth-user/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  });
  return await resp.json();
};

export const forgotPasswordApi = async (email) => {
  const resp = await fetch(`${API}/auth-user/forgot-password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return await resp.json();
};

export const resetPasswordApi = async (resetPasswordLink, newPassword) => {
  const resp = await fetch(`${API}/auth-user/reset-password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resetPasswordLink, newPassword })
  });
  return await resp.json();
};

export const saveAuth = (token, user) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    // Trigger custom event so other components know auth status changed
    window.dispatchEvent(new Event("auth-changed"));
  }
};

export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const getAuthUser = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const removeAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Trigger custom event so other components know auth status changed
    window.dispatchEvent(new Event("auth-changed"));
  }
};

export const getUserProfileApi = async (token) => {
  const resp = await fetch(`${API}/users/profile/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return await resp.json();
};

export const rechargeWalletApi = async (token, amount) => {
  const resp = await fetch(`${API}/users/wallet/recharge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ amount })
  });
  return await resp.json();
};

export const createRazorpayOrderApi = async (token, amount) => {
  const resp = await fetch(`${API}/users/wallet/razorpay-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ amount })
  });
  return await resp.json();
};

export const verifyRazorpayPaymentApi = async (token, paymentData) => {
  const resp = await fetch(`${API}/users/wallet/razorpay-verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(paymentData)
  });
  return await resp.json();
};
