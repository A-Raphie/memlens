import React, { useRef } from "react";

export default function UploadPanel({ onUpload, uploading }) {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (file) onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  if (uploading) {
    return (
      <div className="upload-loading">
        Ingesting sessions into HydraDB...
      </div>
    );
  }

  return (
    <>
      <div
        className="upload-dropzone"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="upload-icon">&#9650;</div>
        <div className="upload-text">
          <span className="upload-text-accent">Click to upload</span> or drag a JSON file
        </div>
        <div className="upload-hint">LongMemEval format &middot; Session logs</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="upload-input"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </>
  );
}
