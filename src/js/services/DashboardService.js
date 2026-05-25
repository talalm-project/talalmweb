import axios from "axios";
import { buildHeaders } from "../helpers/AppHelper";

const DashboardService = {
  fetchDashboard() {
    return axios.get(`${API_BASE_URL}/dashboard`, {
      headers: buildHeaders()
    });
  }
};

export default DashboardService;
