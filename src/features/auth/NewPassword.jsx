import React, { useState } from "react";
import new_password from "../assets/images/login-register-icons/reset_email.svg";
import { useNavigate, useParams } from "react-router-dom";
// Import CSS from local folder
import "./NewPassword.css";
// Use the shared api instance from the host application
import api from "../../api/axiosInstance";
import Swal from "sweetalert2";

function NewPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const { resetToken } = useParams();
  const navigate = useNavigate();
  console.log(resetToken);

  const fireAlert = () => {
    Swal.fire({
      title: "Password has been updated successfully!!!",
      icon: "success",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/login");
      }
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    // basic form validation
    if (newPassword === "" || confirmPassword === "") {
      setErrorMessage("Password and confirm password required!");
      return;
    } else if (confirmPassword !== newPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    try {
      // Call the E‑Learning backend via the gateway. The api instance will
      // automatically prefix requests with /api and attach the Authorization
      // header if the user is logged in. Because this route is public, no
      // token is required.
      const response = await api.post("/auth/reset-password", {
        resetToken,
        newPassword,
      });
      if (response.status === 200) {
        fireAlert();
        setNewPassword("");
        setConfirmPassword("");
        setErrorMessage("");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Problem updating password!!!");
    }
  };

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
  var no;

  const passwordIndicator = () => {
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
        ((input.value.match(passRegexWeak) &&
          input.value.match(passRegexMedium)) ||
          (input.value.match(passRegexMedium) &&
            input.value.match(passRegexStrong)) ||
          (input.value.match(passRegexWeak) &&
            input.value.match(passRegexStrong)))
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
      <div className="account-container">
        <div className="forms-container">
          <div className="new">
            {/* Form that contains new password and confirm password fields */}
            <form
              className="sign-in-form"
              noValidate
              onSubmit={handleUpdateSubmit}
            >
              <h2 className="form-title">New Password</h2>
              {updateSuccess ? (
                <p className="emailSuccess">{updateSuccess}</p>
              ) : (
                errorMessage && <p>{errorMessage}</p>
              )}
              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input
                  className="pass"
                  type="password"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyUp={passwordIndicator}
                  placeholder="New Password*"
                />
                <span className="show-pass">SHOW</span>
              </div>
              <div className="pass-indicator">
                <span className="weak"></span>
                <span className="medium"></span>
                <span className="strong"></span>
              </div>
              <div className="pass-text"></div>
              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password*"
                />
              </div>
              {/* Redirect to login form */}
              <input type="submit" className="account-btn" value="Change" />
            </form>
          </div>
        </div>

        <div className="new-panels-container">
          <div className="new-panel new-left-panel">
            <div className="new-panel-content">
              <h3>Have received a reset password email?</h3>
              <p>
                Jut enter your new password here and you'll have access to your
                account once again!
              </p>
            </div>
            <img src={new_password} className="image" alt="sign in logo" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewPassword;
