import React from "react";

const UploadField = ({
  title,
  subtitle,
  file,
  accept,
  inputId,
  onFileChange,
  onDrop,
  hasError,
  disabled,
}) => {
  return (
    <div
      className={`candidatura-upload-box ${hasError ? "input-error" : ""}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={() => !disabled && document.getElementById(inputId).click()}
      style={{
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <h6>{title}</h6>
      <p className="candidatura-upload-subtitle">{subtitle}</p>
      <div className="candidatura-upload-area">
        {file ? file.name : "Arraste o arquivo ou clique Aqui"}
      </div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={onFileChange}
        disabled={disabled}
      />
    </div>
  );
};

export default UploadField;
