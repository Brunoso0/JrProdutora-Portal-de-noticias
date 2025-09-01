import React from "react";
import "../styles/SidebarFestival.css";

const SidebarFestival = ({ setPaginaSelecionada, modoJurado = false }) => {
  return (
    <div className="sidebar-festival">
      <h2>{modoJurado ? "Painel do Jurado" : "Admin Festival"}</h2>
      <ul>
        {/* Ver Candidatos — compatível com jurado e admin */}
        <li
          onClick={() => {
            if (!modoJurado && setPaginaSelecionada) {
              setPaginaSelecionada("controleCandidatos");
            }
          }}
          className={modoJurado ? "ativo" : ""}
        >
          Ver Candidatos
        </li>

        {/* Opções visíveis só para admin */}
        {!modoJurado && (
          <>
            <li onClick={() => setPaginaSelecionada("candidatos")}>Editar Candidatos</li>
            <li onClick={() => setPaginaSelecionada("jurados")}>Controle de Jurados</li>
            <li onClick={() => setPaginaSelecionada("etapas")}>Controle de Etapas</li>
            <li onClick={() => setPaginaSelecionada("dashboard")}>Tabela do Candidato</li>
            <li onClick={() => setPaginaSelecionada("DashboardVotosPublicos")}>Votos Públicos</li>
            <li onClick={() => setPaginaSelecionada("selecionarVotacao")}>Liberar Votação Pública</li>
            <li onClick={() => setPaginaSelecionada("AvancosDoDia")}>Avanços do Dia</li>
            <li onClick={() => setPaginaSelecionada("DashboardTotalVotos")}>Total de Votos</li>
            <li onClick={() => setPaginaSelecionada("RankingVotos")}>Ranking do Dia</li>
            {/* <li onClick={() => setPaginaSelecionada("VencedoresFestival2025")}>Vencedores 2025</li> */}
          </>
        )}
      </ul>
    </div>
  );
};

export default SidebarFestival;
