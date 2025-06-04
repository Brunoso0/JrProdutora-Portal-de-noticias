import React from "react";
import "../styles/SidebarFestival.css";

const SidebarFestival = ({ setPaginaSelecionada }) => {
  return (
    <div className="sidebar-festival">
      <h2>Admin Festival</h2>
      <ul>
        <li onClick={() => setPaginaSelecionada("candidatos")}>Editar Candidatos</li>
        <li onClick={() => setPaginaSelecionada("controleCandidatos")}>Ver Candidatos</li>
        <li onClick={() => setPaginaSelecionada("jurados")}>Controle de Jurados</li>
        <li onClick={() => setPaginaSelecionada("etapas")}>Controle de Etapas</li>
        <li onClick={() => setPaginaSelecionada("dashboard")}>Tabela do Candidato</li>
        <li onClick={() => setPaginaSelecionada("DashboardVotosPublicos")}>Votos Publicos</li>
        <li onClick={() => setPaginaSelecionada("selecionarVotacao")}>Liberar Votação publica</li>
        <li onClick={() => setPaginaSelecionada("AvancosDoDia")}>Avanços do dia</li>
        <li onClick={() => setPaginaSelecionada("DashboardTotalVotos")}>Total de Votos </li>
        <li onClick={() => setPaginaSelecionada("RankingVotos")}>Ranking do Dia</li>
      </ul>
    </div>
  );
};

export default SidebarFestival;
