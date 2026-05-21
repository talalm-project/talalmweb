import axios from "axios";
import { buildHeaders } from "../helpers/AppHelper";

const NotebookService = {
  fetchNotebooks(args = {}) {
    return axios.get(`${API_BASE_URL}/notebooks`, {
      params: args,
      headers: buildHeaders()
    });
  },

  fetchNotebook(id) {
    return axios.get(`${API_BASE_URL}/notebooks/${id}`, {
      headers: buildHeaders()
    });
  },

  createNotebook(args) {
    return axios.post(`${API_BASE_URL}/notebooks`, args, {
      headers: buildHeaders()
    });
  }
};

export default NotebookService;
