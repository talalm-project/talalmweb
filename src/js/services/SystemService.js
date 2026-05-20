import axios from "axios";
import { buildHeaders } from "../helpers/AppHelper";

export const fetchDoctor = () => {
  return axios.get(`${API_BASE_URL}/system/doctor`, {
    headers: buildHeaders()
  });
};

export const fetchLocalModels = () => {
  return axios.get(`${API_BASE_URL}/system/local_models`, {
    headers: buildHeaders()
  });
};
