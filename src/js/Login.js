import React, { useState } from "react";
import { renderInputErrors, getInputClassName } from "./helpers/AppHelper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { 
  login,
  createSessionAndRedirect
} from "./services/AuthService";

export default Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);

    login({ email, password}).then((payload) => {
      createSessionAndRedirect({
        token: payload.data.token,
        user: payload.data.user
      });
    }).catch((payload) => {
      console.log("Something went wrong");
      console.log(payload.response);
      setErrors(payload.response.data);
      setIsLoading(false);
    });
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <div className="card shadow-lg login-form">
        <div className="card-body p-4">
          <h1 className="h3 mb-3 text-center mt-2">
            Sign In
          </h1>
          <hr/>
          <div className="form-group p-2">
            <label>
              <FontAwesomeIcon icon={faUser} className="me-2"/>
              Email:
            </label>
            <input
              value={email}
              disabled={isLoading}
              className={`mt-2 ${getInputClassName(errors, 'email')}`}
              onKeyDown={(event) => {
                if (event.key == 'Enter') {
                  handleLogin()
                }
              }}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
            {renderInputErrors(errors, 'email')}
          </div>
          <div className="form-group p-2">
            <label>
              <FontAwesomeIcon icon={faLock} className="me-2"/>
              Password:
            </label>
            <input
              value={password}
              disabled={isLoading}
              className={`mt-2 ${getInputClassName(errors, 'password')}`}
              onKeyDown={(event) => {
                if (event.key == 'Enter') {
                  handleLogin()
                }
              }}
              type="password"
              onChange={(event) => {
                setPassword(event.target.value);
              }}
            />
            {renderInputErrors(errors, 'password')}
          </div>
          <div className="mt-2"/>
          <div className="form-group p-2">
            <button
              className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2"
              disabled={isLoading}
              onClick={handleLogin}
              onKeyDown={(event) => {
                if (event.key == 'Enter') {
                  handleLogin()
                }
              }}
            >
              <FontAwesomeIcon icon={faRightToBracket}/>
              <span>Login</span>
            </button>
          </div>
          <hr/>
          <center>
            <small className="text-muted">
              {API_BASE_URL}
            </small>
          </center>
        </div>
      </div>
    </div>
  );
}
