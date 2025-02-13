import React from "react";
import "../styles/LoginPage.css"; // Ensure specific styles for LoginLayout

const LoginLayout = ({ children }) => {
  return (
    <div className="login-layout">
      {children}
    </div>
  );
};

export default LoginLayout;
