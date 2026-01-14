import React from "react";
import "../../styles/buttonCadastro.css";

const Button = ({ type = "button", className = "", children, ...props }) => {
  return (
    <button type={type} className={`btn-cadastro ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
