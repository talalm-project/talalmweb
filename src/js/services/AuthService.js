import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { buildHeaders } from '../helpers/AppHelper';

export const AUTH_STATE_CHANGE_EVENT = "admin-panel-auth-state-change";

const emitAuthStateChange = () => {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
}

const clearSession = () => {
  localStorage.removeItem(TOKEN_BEARER);
}

export const login = (args) => {
  return axios.post(
    `${API_BASE_URL}/login`,
    {
      email: args.email,
      password: args.password
    },
    {
      headers: buildHeaders()
    },
  )
}

export const changePassword = (args) => {
  return axios.put(
    `${API_BASE_URL}/system/change_password`,
    {
      password: args.password,
      password_confirmation: args.password_confirmation
    },
    {
      headers: buildHeaders()
    }
  );
}

export const createSession = (args) => {
  // Store the token
  localStorage.setItem(TOKEN_BEARER, args.token);
  emitAuthStateChange();
}

export const createSessionAndRedirect = (args) => {
  createSession(args);
  window.location.replace(`${window.location.pathname}${window.location.search}#/dashboard`);
}

export const destroySession = () => {
  clearSession();
  emitAuthStateChange();
}

export const logoutAndRedirect = () => {
  destroySession();
  window.location.replace(`${window.location.pathname}${window.location.search}#/`);
}

export const isLoggedIn = () => {
  return getCurrentUser() != false;
}

export const getToken = () => {
  return localStorage.getItem(TOKEN_BEARER);
}

export const getCurrentUser = () => {
  const token = getToken();

  if (!token) {
    return false;
  }

  try {
    const currentUser = jwtDecode(token);

    if (currentUser.exp && currentUser.exp * 1000 <= Date.now()) {
      clearSession();
      return false;
    }

    return currentUser;
  } catch (error) {
    clearSession();
    return false;
  }
}
