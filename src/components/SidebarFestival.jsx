import React from "react";
import "../styles/SidebarFestival.css";

const SidebarFestival = ({ setPaginaSelecionada }) => {
  return (
    <div className="sidebar-festival">
      <h2>Admin Festival</h2>
      <ul>
        <li onClick={() => setPaginaSelecionada("candidatos")}>Candidatos</li>
        {/* <li onClick={() => setPaginaSelecionada("etapas")}>Etapas</li> */}
        {/* mais opções futuras */}
      </ul>
    </div>
  );
};

export default SidebarFestival;
