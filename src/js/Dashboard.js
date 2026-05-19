import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faBell,
  faCircleCheck,
  faCloud,
  faCreditCard,
  faFileArrowDown,
  faPlus,
  faServer,
  faTriangleExclamation,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import AdminContent from "./commons/AdminContent";
import PageHeader from "./commons/PageHeader";

const stats = [
  {
    title: "Active Accounts",
    value: "12,480",
    note: "+8.2% vs last month",
    icon: faUsers,
    tone: "primary"
  },
  {
    title: "Monthly Revenue",
    value: "$184,200",
    note: "94 paid invoices this week",
    icon: faCreditCard,
    tone: "success"
  },
  {
    title: "System Health",
    value: "99.94%",
    note: "No critical outages in 14 days",
    icon: faServer,
    tone: "info"
  },
  {
    title: "Pending Alerts",
    value: "07",
    note: "2 require manual review",
    icon: faBell,
    tone: "warning"
  }
];

const activityRows = [
  {
    account: "Northwind Logistics",
    owner: "D. Santiago",
    plan: "Enterprise",
    usage: "82%",
    status: "Healthy"
  },
  {
    account: "BluePeak Retail",
    owner: "K. Ramos",
    plan: "Growth",
    usage: "67%",
    status: "Healthy"
  },
  {
    account: "Delta Grid",
    owner: "A. Lim",
    plan: "Enterprise",
    usage: "91%",
    status: "Watch"
  },
  {
    account: "Signal Harbor",
    owner: "C. Tan",
    plan: "Starter",
    usage: "43%",
    status: "Healthy"
  },
  {
    account: "Atlas Support",
    owner: "M. Cruz",
    plan: "Growth",
    usage: "58%",
    status: "Review"
  }
];

const incidentRows = [
  {
    id: "INC-1042",
    service: "Billing API",
    severity: "Medium",
    updated: "5 mins ago",
    summary: "Retry spikes on invoice sync jobs"
  },
  {
    id: "INC-1040",
    service: "Auth Service",
    severity: "Low",
    updated: "18 mins ago",
    summary: "Elevated password reset requests"
  },
  {
    id: "INC-1037",
    service: "Storage Cluster",
    severity: "High",
    updated: "42 mins ago",
    summary: "Replication lag on secondary region"
  }
];

const priorityItems = [
  {
    title: "Payments reconciliation",
    description: "14 transactions need manual verification before cutoff.",
    icon: faCreditCard,
    tone: "warning"
  },
  {
    title: "Infrastructure rollout",
    description: "EU cluster patch scheduled tonight at 11:00 PM.",
    icon: faCloud,
    tone: "info"
  },
  {
    title: "Support queue",
    description: "Average first response time is down to 9 minutes.",
    icon: faCircleCheck,
    tone: "success"
  }
];

const getBadgeClass = (value) => {
  if (value === "Healthy") {
    return "text-bg-success";
  }

  if (value === "Watch") {
    return "text-bg-warning";
  }

  if (value === "Review") {
    return "text-bg-danger";
  }

  if (value === "High") {
    return "text-bg-danger";
  }

  if (value === "Medium") {
    return "text-bg-warning";
  }

  return "text-bg-secondary";
};

const Dashboard = () => {
  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Overview"
        title="Operations dashboard"
        actions={[
          <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" key="export-report" type="button">
            <FontAwesomeIcon icon={faFileArrowDown} />
            <span>Export</span>
          </button>,
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" key="create-notice" type="button">
            <FontAwesomeIcon icon={faPlus} />
            <span>Notice</span>
          </button>
        ]}
      />

      <div className="row g-3">
        {stats.map((stat) => {
          return (
            <div className="col-12 col-md-6 col-xl-3" key={stat.title}>
              <div className="card shadow-sm h-100 border-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <p className="text-muted text-uppercase small fw-semibold mb-2">
                        {stat.title}
                      </p>
                      <h2 className="h4 mb-1">
                        {stat.value}
                      </h2>
                      <p className="mb-0 text-muted small">
                        {stat.note}
                      </p>
                    </div>
                    <span className={`badge rounded-pill text-bg-${stat.tone} p-3`}>
                      <FontAwesomeIcon icon={stat.icon} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <AdminContent
            title={(
              <div className="d-flex align-items-center gap-2">
                <FontAwesomeIcon icon={faArrowTrendUp} />
                <span>Account Activity</span>
              </div>
            )}
          >
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Account</th>
                    <th>Owner</th>
                    <th>Plan</th>
                    <th>Usage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activityRows.map((row) => {
                    return (
                      <tr key={row.account}>
                        <td className="fw-semibold">{row.account}</td>
                        <td>{row.owner}</td>
                        <td>{row.plan}</td>
                        <td>{row.usage}</td>
                        <td>
                          <span className={`badge ${getBadgeClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminContent>
        </div>

        <div className="col-12 col-xl-4">
          <AdminContent
            title={(
              <div className="d-flex align-items-center gap-2">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <span>Priority Queue</span>
              </div>
            )}
          >
            <div className="d-flex flex-column gap-3">
              {priorityItems.map((item) => {
                return (
                  <div
                    className="border rounded p-3 d-flex align-items-start gap-3"
                    key={item.title}
                  >
                    <span className={`badge text-bg-${item.tone} p-3`}>
                      <FontAwesomeIcon icon={item.icon} />
                    </span>
                    <div>
                      <div className="fw-semibold mb-1">
                        {item.title}
                      </div>
                      <div className="text-muted small">
                        {item.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminContent>
        </div>
      </div>

      <AdminContent
        title={(
          <div className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faBell} />
            <span>Open Incidents</span>
          </div>
        )}
      >
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Incident</th>
                <th>Service</th>
                <th>Severity</th>
                <th>Last Updated</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {incidentRows.map((row) => {
                return (
                  <tr key={row.id}>
                    <td className="fw-semibold">{row.id}</td>
                    <td>{row.service}</td>
                    <td>
                      <span className={`badge ${getBadgeClass(row.severity)}`}>
                        {row.severity}
                      </span>
                    </td>
                    <td>{row.updated}</td>
                    <td>{row.summary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminContent>
    </div>
  );
};

export default Dashboard;
