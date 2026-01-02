import React from "react";
// Import the local CSS instead of referencing the removed Styles directory
import "./ConfirmAccount.css";
import tick_img from "../assets/images/login-register-icons/404-tick.png";
import { Link } from "react-router-dom";

function ConfirmAccount() {
  return (
    <div className="body">
      <div className="confirm-container">
        <div className="confirm-message">
          <div className="popup">
            <img src={tick_img} alt="tick img" />
            <h2 className="confirm-title">Thank you!</h2>
            <p>Your account has been created successfully!</p>
            {/* Redirect to login */}
            <Link to="/account">
              <button type="button" className="confirm-btn">
                OK
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmAccount;
