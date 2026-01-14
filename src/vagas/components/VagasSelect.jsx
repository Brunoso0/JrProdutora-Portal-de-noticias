import React from "react";

const VagasSelect = ({
  vagas,
  selectedJob,
  setSelectedJob,
  hasError,
  disabled,
}) => {
  return (
    <div className={`candidatura-vaga-content ${hasError ? "input-error" : ""}`}>
      <p className="candidatura-vaga-title">Vaga desejada (apenas uma)</p>
      <div className="candidatura-vaga-options">
        {vagas && vagas.length > 0 ? (
          vagas.map((vaga) => (
            <label key={vaga.id} className="candidatura-vaga-label">
              <input
                type="radio"
                name="vaga"
                value={vaga.id}
                checked={selectedJob === String(vaga.id)}
                onChange={() => setSelectedJob(String(vaga.id))}
                className="cyberpunk-checkbox"
                required
                disabled={disabled}
              />
              <span>{vaga.titulo}</span>
            </label>
          ))
        ) : (
          <p>Sem vagas disponíveis no momento</p>
        )}
      </div>
    </div>
  );
};

export default VagasSelect;
