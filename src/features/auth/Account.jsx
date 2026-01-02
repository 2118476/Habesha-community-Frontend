import React, { useEffect, useState } from "react";
import registerLogo from "../assets/images/login-register-icons/undraw_launching_re_tomg.svg";
import loginLogo from "../assets/images/login-register-icons/undraw_secure_login_pdn4.svg";
import { Link, useNavigate } from "react-router-dom";
// Use only the main CSS file to avoid duplicate styles
import './Account.css';
import useForm from "./AccountFunctionality/useForm";
import validateSignUpForm from "./AccountFunctionality/validateSignUpForm";
// Use the host authentication context rather than manually calling the E-Learning API
import useAuth from '../../hooks/useAuth';

function Account({ initialSignUp = false, redirect = "/app/home" }) {
  const { handleChange, values, handleSubmit, errors, showErrors } =
    useForm(validateSignUpForm);

  const today = new Date().toISOString().slice(0, 10);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [validLoginAttempts, setValidLoginAttempts] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErrorMessages, setLoginErrorMessages] = useState("");
  const regexEmail = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[.]{1}[a-zA-Z]{2,}$";

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  // Add class to body for auth page styling
  useEffect(() => {
    document.body.classList.add('auth-page-active');
    document.documentElement.classList.add('auth-page-active');
    
    return () => {
      document.body.classList.remove('auth-page-active');
      document.documentElement.classList.remove('auth-page-active');
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timeRemaining > 0) {
        setTimeRemaining((t) => t - 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining, disabled]);

  useEffect(() => {
    if (timeRemaining === 0) setDisabled(false);
  }, [timeRemaining]);

  // Handle login submit with immediate redirect on success (no popups)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (email === "" || password === "") {
      setLoginErrorMessages("Email address and password required!!!");
      return;
    }
    if (!email.match(regexEmail)) {
      setLoginErrorMessages("Invalid email address!!!");
      return;
    }
    if (password.length < 8) {
      setLoginErrorMessages("Invalid password!!!");
      return;
    }

    try {
      await authLogin({ email, password });
      setLoginErrorMessages("");
      setTimeRemaining(null);
      navigate(redirect); // instant redirect on success
    } catch (err) {
      setValidLoginAttempts((prev) => prev + 1);

      let reason = "Login failed. Please check your credentials.";
      if (err && err.response) {
        const status = err.response.status;
        const data = err.response.data;
        if (status === 401 || status === 403) {
          reason =
            (data && (data.message || data.error))
              ? data.message || data.error
              : "Invalid password.";
        } else if (status === 404) {
          reason = "User not found.";
        } else if (data && (data.message || data.error)) {
          reason = data.message || data.error;
        }
      } else if (err && err.message) {
        reason = err.message;
      }

      setLoginErrorMessages(reason);

      // rate-limit attempts (example)
      setDisabled(true);
      setTimeRemaining(30); // 30s cooldown
    } finally {
      setEmail("");
      setPassword("");
    }
  };

  // Slide animation state for switching panels
  const [isSignUpClick, setIsSignUpClick] = useState(initialSignUp);
  const signUpBtn = () => setIsSignUpClick(true);
  const signInBtn = () => setIsSignUpClick(false);

  // Password strength UI (DOM queries kept as-is from your original)
  const indicator = document.querySelector(".pass-indicator");
  const input = document.querySelector(".pass");
  const weak = document.querySelector(".weak");
  const medium = document.querySelector(".medium");
  const strong = document.querySelector(".strong");
  const text = document.querySelector(".pass-text");
  const showPass = document.querySelector(".show-pass");
  const passRegexWeak = /[a-z]/;
  const passRegexMedium = /\d+/;
  const passRegexStrong = /.[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
  let no;

  const passwordIndicator = () => {
    if (!input) return;
    if (input.value !== "") {
      indicator.style.display = "block";
      indicator.style.display = "flex";
      if (
        input.value.length <= 3 &&
        (input.value.match(passRegexWeak) ||
          input.value.match(passRegexMedium) ||
          input.value.match(passRegexStrong))
      )
        no = 1;
      if (
        input.value.length >= 6 &&
        ((input.value.match(passRegexWeak) && input.value.match(passRegexMedium)) ||
          (input.value.match(passRegexMedium) && input.value.match(passRegexStrong)) ||
          (input.value.match(passRegexWeak) && input.value.match(passRegexStrong)))
      )
        no = 2;
      if (
        input.value.length >= 6 &&
        input.value.match(passRegexWeak) &&
        input.value.match(passRegexMedium) &&
        input.value.match(passRegexStrong)
      )
        no = 3;
      if (no === 1) {
        weak.classList.add("active");
        text.style.display = "block";
        text.textContent = "Your password is too weak";
        text.classList.add("weak");
      }
      if (no === 2) {
        medium.classList.add("active");
        text.textContent = "Your password is medium";
        text.classList.add("medium");
      } else {
        medium.classList.remove("active");
        text.classList.remove("medium");
      }
      if (no === 3) {
        weak.classList.add("active");
        medium.classList.add("active");
        strong.classList.add("active");
        text.textContent = "Your password is strong";
        text.classList.add("strong");
      } else {
        strong.classList.remove("active");
        text.classList.remove("strong");
      }
      showPass.style.display = "block";
      showPass.onclick = function () {
        if (input.type === "password") {
          input.type = "text";
          showPass.textContent = "HIDE";
          showPass.style.color = "#acacac";
        } else {
          input.type = "password";
          showPass.textContent = "SHOW";
          showPass.style.color = "#000";
        }
      };
    } else {
      indicator.style.display = "none";
      text.style.display = "none";
      showPass.style.display = "none";
    }
  };
  
  return (
    <div className="body">
      <div className={`account-container ${isSignUpClick ? "sign-up-mode" : ""}`}>
         <div class="jebena"></div>
        <div className="forms-container">
          <div className="signin-signup">
            {/* Signin/login form */}
            <form className="sign-in-form" noValidate onSubmit={handleLoginSubmit}>
              <h2 className="form-title">Sign in</h2>

              {/* Inline error */}
              {loginErrorMessages && <p>{loginErrorMessages}</p>}

              <div className="input-field">
                <i className="fas fa-envelope"></i>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                />
              </div>

              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>

              <input
                type="submit"
                value="Login"
                className="account-btn solid"
                disabled={disabled}
              />

              {timeRemaining > 0 && (
                <p>Please wait {timeRemaining} seconds before trying to sign in again.</p>
              )}

              <Link to="/forgot-password" className="forgot">
                Forgot your password?
              </Link>
            </form>

            {/* Signup form */}
            <form className="sign-up-form" noValidate onSubmit={handleSubmit}>
              <h2 className="form-title">Sign up</h2>

              <div className="input-field">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  name="firstName"
                  value={values.firstName}
                  onChange={handleChange}
                  placeholder="First Name*"
                />
              </div>
              {errors ? errors.firstName && showErrors && <p>{errors.firstName}</p> : ""}

              <div className="input-field">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  name="lastName"
                  value={values.lastName}
                  onChange={handleChange}
                  placeholder="Last Name*"
                />
              </div>
              {errors ? errors.lastName && showErrors && <p>{errors.lastName}</p> : ""}

              <div className="input-field">
                <i className="fas fa-calendar-alt"></i>
                <input
                  className="date"
                  type="date"
                  name="dob"
                  max={today}
                  value={values.dob}
                  onChange={handleChange}
                  placeholder="Date of Birth*"
                />
              </div>
              {errors ? errors.dob && showErrors && <p>{errors.dob}</p> : ""}

              <div className="input-field">
                <i className="fas fa-globe-americas"></i>
                <input
                  type="text"
                  name="country"
                  value={values.country}
                  onChange={handleChange}
                  placeholder="Country*"
                />
              </div>
              {errors ? errors.country && showErrors && <p>{errors.country}</p> : ""}

              <div className="input-field">
                <i className="fas fa-phone"></i>
                <input
                  type="text"
                  name="phone"
                  value={values.phone}
                  onChange={handleChange}
                  placeholder="Phone Number*"
                />
              </div>
              {errors ? errors.phone && showErrors && <p>{errors.phone}</p> : ""}

              <div className="input-field">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  placeholder="Email*"
                />
              </div>
              {errors ? errors.email && showErrors && <p>{errors.email}</p> : ""}

              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input
                  className="pass"
                  type="password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onKeyUp={passwordIndicator}
                  placeholder="Password*"
                />
                <span className="show-pass">SHOW</span>
              </div>

              <div className="pass-indicator">
                <span className="weak"></span>
                <span className="medium"></span>
                <span className="strong"></span>
              </div>
              <div className="pass-text"></div>
              {errors ? errors.password && showErrors && <p>{errors.password}</p> : ""}

              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  name="confirmPassword"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password*"
                />
              </div>
              {errors ? errors.confirmPassword && showErrors && <p>{errors.confirmPassword}</p> : ""}

              <input type="submit" className="account-btn" value="Sign up" />
            </form>
          </div>
        </div>

        {/* Panels */}
        <div className="panels-container">
          <div className="panel left-panel">
            <div className="panel-content">
              <h3>New here ?</h3>
              <p data-autocontrast>
       Hello, please click here to create an account and start journey with us!
     </p>
              <button
                className="account-btn transparent"
                id="sign-up-btn"
                onClick={signUpBtn}
              >
                Sign up
              </button>
            </div>
            <img src={registerLogo} className="image" alt="sign up logo" />
          </div>

          <div className="panel right-panel">
            <div className="panel-content">
              <h3>One of us ?</h3>
              <p>
                Welcome back, please click here to sign in with your personal info!
              </p>
              <button
                className="account-btn transparent"
                id="sign-in-btn"
                onClick={signInBtn}
              >
                Sign in
              </button>
            </div>
            <img src={loginLogo} className="image" alt="sign in logo" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
