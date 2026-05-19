import axios from "axios";
import { buildHeaders } from "../helpers/AppHelper";

export const fetchUsers = (args = {}) => {
  return axios.get(`${API_BASE_URL}/users`, {
    params: args,
    headers: buildHeaders()
  });
};

export const fetchUser = (id) => {
  return axios.get(`${API_BASE_URL}/users/${id}`, {
    headers: buildHeaders()
  });
};

export const createUser = (args) => {
  return axios.post(`${API_BASE_URL}/users`, args, {
    headers: buildHeaders()
  });
};

export const updateUser = (id, args) => {
  return axios.put(`${API_BASE_URL}/users/${id}`, args, {
    headers: buildHeaders()
  });
};

export const deleteUser = (id) => {
  return axios.delete(`${API_BASE_URL}/users/${id}`, {
    headers: buildHeaders()
  });
};

export const activateUser = (id) => {
  return axios.put(`${API_BASE_URL}/users/${id}/activate`, {}, {
    headers: buildHeaders()
  });
};
