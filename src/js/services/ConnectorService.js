import axios from "axios";
import { buildFileUploadHeaders, buildHeaders } from "../helpers/AppHelper";

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
  },

  inferConnector(id, args) {
    return axios.post(`${API_BASE_URL}/connectors/${id}/infer`, args, {
      headers: buildHeaders()
    });
  },

  generateEmbeddings(id, file) {
    const formData = new FormData();
    formData.append("file", file);

    return axios.post(`${API_BASE_URL}/connectors/${id}/generate_embeddings`, formData, {
      headers: buildFileUploadHeaders()
    });
  }
};

export default ConnectorService;
