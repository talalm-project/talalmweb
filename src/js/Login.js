import React, { useState } from "react";
import { renderInputErrors, getInputClassName } from "./helpers/AppHelper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase, faLock, faMicrochip, faRightToBracket, faServer, faUser } from "@fortawesome/free-solid-svg-icons";
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
    <div className="auth-screen">
      <div className="login-shell">
        <section className="login-banner" aria-label="Application overview">
          <div className="login-brand-mark">
            <FontAwesomeIcon icon={faMicrochip} />
          </div>
          <div>
            <p className="login-eyebrow">Local-first AI workspace</p>
            <h1 className="login-banner-title">
              Tala LM
            </h1>
            <p className="login-banner-copy">
              Run, manage, and compare local LLMs from your own machine while keeping notebooks, files, and prompts close to your environment.
            </p>
          </div>
          <div className="login-feature-grid" aria-label="Application highlights">
            <div className="login-feature">
              <FontAwesomeIcon icon={faServer} />
              <span>Local model runtime</span>
            </div>
            <div className="login-feature">
              <FontAwesomeIcon icon={faDatabase} />
              <span>Private notebook context</span>
            </div>
            <div className="login-feature">
              <FontAwesomeIcon icon={faLock} />
              <span>Session-based access</span>
            </div>
          </div>
        </section>

        <section className="card talalm-panel login-form" aria-label="Sign in">
          <div className="card-body">
            <div className="login-form-header">
              <p className="login-eyebrow">Welcome back</p>
              <h2 className="login-title">
                Sign in
              </h2>
            </div>

            <div className="form-group login-field">
              <label>
                <FontAwesomeIcon icon={faUser} className="me-2"/>
                Email
              </label>
              <input
                value={email}
                disabled={isLoading}
                className={getInputClassName(errors, 'email')}
                autoComplete="email"
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

            <div className="form-group login-field">
              <label>
                <FontAwesomeIcon icon={faLock} className="me-2"/>
                Password
              </label>
              <input
                value={password}
                disabled={isLoading}
                className={getInputClassName(errors, 'password')}
                autoComplete="current-password"
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

            <button
              className="btn btn-primary login-submit d-inline-flex align-items-center justify-content-center gap-2"
              disabled={isLoading}
              onClick={handleLogin}
              onKeyDown={(event) => {
                if (event.key == 'Enter') {
                  handleLogin()
                }
              }}
            >
              <FontAwesomeIcon icon={faRightToBracket}/>
              <span>{isLoading ? "Signing in" : "Login"}</span>
            </button>

            <div className="login-api-base">
              {API_BASE_URL}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
