import React, { useState } from "react";
import forgotPassword from "../assets/images/login-register-icons/forgot_password.svg";
// Import CSS from the local auth directory
import "./ResetPassword.css";
// Use the shared api instance from the host application
import api from "../../api/axiosInstance";
import Swal from "sweetalert2";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [emailErrorMessage, setEmailErrorMessage] = useState("");

  const fireAlert = () => {
    Swal.fire({
      title: `An email has been sent to ${email} with instructions to reset password!!!`,
      icon: "success",
    }).then(() => {
      //
    });
  };

  const regexEmail = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[.]{1}[a-zA-Z]{2,}$";

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (email === "") {
      setEmailErrorMessage("Email Address required!");
      return;
    } else if (!email.match(regexEmail)) {
      setEmailErrorMessage(
        "The email address you entered is invalid. Please, try again!"
      );
      return;
    }

    try {
      // Use the gateway prefix and E‑Learning namespace for the endpoint
      const res = await api.post("/auth/forgot-password", { email });
      if (res.status === 200) {
        fireAlert();
        setEmail("");
        setEmailErrorMessage("");
      }
    } catch (error) {
      console.error(error);
      setEmailErrorMessage(
        "The email address you entered does not exist. Please, try again!"
      );
    }
  };

  return (
    <div className="body">
      <div className="account-container">
        <div className="forms-container">
          <div className="reset">
            {/* Form that contains email address field */}
            <form
              className="sign-in-form"
              noValidate
              onSubmit={handleEmailSubmit}
            >
              <h2 className="form-title">Reset Password</h2>
              {emailErrorMessage && <p>{emailErrorMessage}</p>}
              <div className="input-field">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address*"
                />
              </div>
              {/* Link to send reset password email with link to second form */}
              <input
                type="submit"
                value="Send Reset Email"
                className="account-btn"
              />
            </form>
          </div>
        </div>

        <div className="reset-panels-container">
          <div className="reset-panel reset-left-panel">
            <div className="reset-panel-content">
              <h3>Forgot your password ?</h3>
              <p>
                No problem, tech friend. Just enter your email and we'll send
                you an reset email!
              </p>
            </div>
            <img src={forgotPassword} className="image" alt="sign up logo" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
