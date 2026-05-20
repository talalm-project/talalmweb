import axios from "axios";
import { buildHeaders } from "../helpers/AppHelper";

const ConnectorService = {
  fetchConnectors(args = {}) {
    return axios.get(`${API_BASE_URL}/connectors`, {
      params: args,
      headers: buildHeaders()
    });
  }
};

export default ConnectorService;
