import axios from "axios";
import { buildFileUploadHeaders, buildHeaders } from "../helpers/AppHelper";

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

  fetchNotebookFiles(notebookId) {
    return axios.get(`${API_BASE_URL}/notebooks/${notebookId}/notebook_files`, {
      headers: buildHeaders()
    });
  },

  createNotebookFile(notebookId, args) {
    const formData = new FormData();
    formData.append("name", args.name);
    formData.append("file", args.file);

    return axios.post(`${API_BASE_URL}/notebooks/${notebookId}/notebook_files`, formData, {
      headers: buildFileUploadHeaders()
    });
  },

  deleteNotebookFile(notebookId, notebookFileId) {
    return axios.delete(`${API_BASE_URL}/notebooks/${notebookId}/notebook_files/${notebookFileId}`, {
      headers: buildHeaders()
    });
  },

  createNotebook(args) {
    return axios.post(`${API_BASE_URL}/notebooks`, args, {
      headers: buildHeaders()
    });
  },

  inferNotebook(id, args) {
    return axios.post(`${API_BASE_URL}/notebooks/${id}/infer`, args, {
      headers: buildHeaders()
    });
  },

  deleteNotebook(id) {
    return axios.delete(`${API_BASE_URL}/notebooks/${id}`, {
      headers: buildHeaders()
    });
  }
};

export default NotebookService;
