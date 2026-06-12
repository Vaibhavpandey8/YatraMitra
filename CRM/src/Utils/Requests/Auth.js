import axios from "axios";
import jwt from "jsonwebtoken";
import setAuthToken from "../setAuthToken";

import { JWT_SECRET, jwtKey } from "../config";
import {
  removeItemFromLocalStorage,
  getItemFromLocalStorage,
  setItemToLocalStorage
} from "./LocalStorage";

export const signUp = user => axios.post("/auth-owner/signup", user);

export const verifySignupOtp = data => axios.post("/auth-owner/verify-signup-otp", data);

export const resendSignupOtp = data => axios.post("/auth-owner/resend-signup-otp", data);

export const signIn = user => axios.post("/auth-owner/signin", user);

export const verifyOtp = data => axios.post("/auth-owner/verify-otp", data);

// Forgot password
export const forgotPassword = data => axios.post("/auth-owner/forgot-password", data);
export const verifyForgotOtp = data => axios.post("/auth-owner/verify-forgot-otp", data);
export const resetPassword = data => axios.post("/auth-owner/reset-password", data);


export const refreshToken = id =>
  axios.post("/auth-owner/refreshToken", { _id: id });

export const authenticate = (data, next) => {
  if (typeof window !== "undefined") {
    setItemToLocalStorage(jwtKey, JSON.stringify(data.data));
    setAuthToken(isAuthenticated().token);
    next();
  }
};

export const isAuthenticated = () => {
  if (typeof window == "undefined") {
    return false;
  }

  let jsontoken = getItemFromLocalStorage(jwtKey);

  if (jsontoken) {
    let { token } = JSON.parse(jsontoken);

    try {
      const decoded = jwt.decode(token);
      if (!decoded) {
        signout();
        return false;
      }
      return { token, user: { ...decoded } };
    } catch (err) {
      signout();
      return false;
    }
  } else {
    return false;
  }
};

export const signout = () => {
  if (typeof window !== "undefined") {
    removeItemFromLocalStorage(jwtKey);
    return true;
  }
};