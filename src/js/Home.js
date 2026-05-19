import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";

export default Home = () => {
  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="text-center p-4">
        <h1 className="display-5 fw-bold mb-3">
          CloudBand Admin Panel
        </h1>
        <p className="lead text-muted mb-4">
          Manage users, billing, and system settings from a single place.
        </p>
        <Link className="btn btn-primary d-inline-flex align-items-center gap-2" to="/login">
          <FontAwesomeIcon icon={faRightToBracket} />
          <span>Go to Login</span>
        </Link>
      </div>
    </div>
  );
}
