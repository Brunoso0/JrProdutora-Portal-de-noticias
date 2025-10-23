import React, { useState } from "react";
import SidebarFestival from "../components/SidebarFestival";
import ControleJurados from "../components/ControleJurados";
import ControleEtapas from "../components/ControleEtapas";
import CandidatosFestivalAdmin from "./CandidatosFestivalAdmin";
import ControleCandidatos from "../components/ControleCandidatos";
import Classificatoria from "../components/Classificatoria";
import DashboardFestival from "../components/DashboardFestival";
import DashboardVotosPublicos from "../components/DashboardVotosPublicos";
import DashboardTotalVotos from "../components/DashboardTotalVotos";
import SelecionarVotacao from "../components/SelecionarVotacao";
import AvancosDoDia from "../components/AvancosDoDia";
import RankingVotos from "../components/RankingVotos";
import VencedoresFestival2025 from "../components/VencedoresFestival2025";
import ControleSessao from "../components/ControleSessao";
import ResultadosSessoes from "../components/ResultadosSessoes";
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
      
      case "classificatoria":
        return <Classificatoria />;

      case "dashboard":
        return <DashboardFestival />;

      case "DashboardVotosPublicos":
        return <DashboardVotosPublicos />;

      case "selecionarVotacao":
        return <SelecionarVotacao />;
        
      case "AvancosDoDia":
        return <AvancosDoDia />;

      case "DashboardTotalVotos":
        return <DashboardTotalVotos />;

      case "RankingVotos":
        return <RankingVotos />;

      case "VencedoresFestival2025":
        return <VencedoresFestival2025 />;

      case "controleSessao":
        return <ControleSessao />;

      case "resultadosSessoes":
        return <ResultadosSessoes />;

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
