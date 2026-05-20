import axios from "axios";
import { buildHeaders } from "../helpers/AppHelper";

const ConnectorService = {
  fetchConnectors(args = {}) {
    return axios.get(`${API_BASE_URL}/connectors`, {
      params: args,
      headers: buildHeaders()
    });
  },

  fetchConnector(id) {
    return axios.get(`${API_BASE_URL}/connectors/${id}`, {
      headers: buildHeaders()
    });
  },

  createConnector(args) {
    return axios.post(`${API_BASE_URL}/connectors`, args, {
      headers: buildHeaders()
    });
  },

  updateConnector(id, args) {
    return axios.put(`${API_BASE_URL}/connectors/${id}`, args, {
      headers: buildHeaders()
    });
  }
};

export default ConnectorService;
