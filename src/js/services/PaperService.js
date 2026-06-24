import axios from "axios";
import { buildFileUploadHeaders, buildHeaders } from "../helpers/AppHelper";

const PaperService = {
  fetchPapers() {
    return axios.get(`${API_BASE_URL}/papers`, {
      headers: buildHeaders()
    });
  },

  fetchPaper(id) {
    return axios.get(`${API_BASE_URL}/papers/${id}`, {
      headers: buildHeaders()
    });
  },

  fetchPaperFiles(paperId) {
    return axios.get(`${API_BASE_URL}/papers/${paperId}/files`, {
      headers: buildHeaders()
    });
  },

  fetchPaperFile(paperId, fileId) {
    return axios.get(`${API_BASE_URL}/papers/${paperId}/files/${fileId}`, {
      headers: buildHeaders()
    });
  },

  fetchPaperFileContent(paperId, fileId) {
    return axios.get(`${API_BASE_URL}/papers/${paperId}/files/${fileId}/content`, {
      headers: buildHeaders()
    });
  },

  updatePaperFileContent(paperId, fileId, args) {
    return axios.put(`${API_BASE_URL}/papers/${paperId}/files/${fileId}/content`, args, {
      headers: buildHeaders()
    });
  },

  uploadPaperFile(paperId, file, options = {}) {
    const formData = new FormData();
    formData.append("file", file);
    if (options.path) {
      formData.append("path", options.path);
    }

    return axios.post(`${API_BASE_URL}/papers/${paperId}/files/upload`, formData, {
      headers: buildFileUploadHeaders(),
      onUploadProgress: options.onUploadProgress
    });
  },

  deletePaperFile(paperId, fileId) {
    return axios.delete(`${API_BASE_URL}/papers/${paperId}/files/${fileId}`, {
      headers: buildHeaders()
    });
  },

  deletePaperFolder(paperId, path) {
    return axios.delete(`${API_BASE_URL}/papers/${paperId}/folders`, {
      headers: buildHeaders(),
      params: { path }
    });
  },

  compilePaper(paperId) {
    return axios.post(`${API_BASE_URL}/papers/${paperId}/compile`, {}, {
      headers: buildHeaders()
    });
  },

  fetchCompileJob(paperId, jobId) {
    return axios.get(`${API_BASE_URL}/papers/${paperId}/compile-jobs/${jobId}`, {
      headers: buildHeaders()
    });
  },

  fetchCompileJobs(paperId) {
    return axios.get(`${API_BASE_URL}/papers/${paperId}/compile-jobs`, {
      headers: buildHeaders()
    });
  },

  downloadCompileJobPdf(paperId, jobId) {
    return axios.get(`${API_BASE_URL}/papers/${paperId}/compile-jobs/${jobId}/pdf`, {
      headers: buildHeaders(),
      responseType: "blob"
    });
  },

  downloadLatestPdf(paperId) {
    return axios.get(`${API_BASE_URL}/papers/${paperId}/latest-pdf`, {
      headers: buildHeaders(),
      responseType: "blob"
    });
  },

  createPaper(args) {
    return axios.post(`${API_BASE_URL}/papers`, args, {
      headers: buildHeaders()
    });
  },

  deletePaper(id) {
    return axios.delete(`${API_BASE_URL}/papers/${id}`, {
      headers: buildHeaders()
    });
  }
};

export default PaperService;
