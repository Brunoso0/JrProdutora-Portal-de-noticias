import React, { useState } from "react";
import SidebarFestival from "../components/SidebarFestival";
import ControleJurados from "../components/ControleJurados";
import ControleEtapas from "../components/ControleEtapas";
import CandidatosFestivalAdmin from "./CandidatosFestivalAdmin";
import ControleCandidatos from "../components/ControleCandidatos";
import DashboardFestival from "../components/DashboardFestival";
import "../styles/PainelFestival.css";

const PainelCandidatos = () => {
  const [paginaSelecionada, setPaginaSelecionada] = useState("candidatos");

  const renderizarConteudo = () => {
    switch (paginaSelecionada) {
      case "candidatos":
        return <CandidatosFestivalAdmin />;
      case "jurados":
        return <ControleJurados />;
      case "etapas":
        return <ControleEtapas />;
      case "controleCandidatos":
        return <ControleCandidatos />;
      case "dashboard":
        return <DashboardFestival />;
      default:
        return <div>Selecione uma opção no menu</div>;
    }
  };

  return (
    <div className="painel-festival">
      <SidebarFestival setPaginaSelecionada={setPaginaSelecionada} />
      <div className="conteudo-festival">{renderizarConteudo()}</div>
    </div>
  );
};

export default PainelCandidatos;
