import React, { useState } from "react";
import SidebarFestival from "../components/SidebarFestival";
import CandidatosFestivalAdmin from "./CandidatosFestivalAdmin"; // ✅ Versão com edição
import "../styles/PainelFestival.css";

const PainelCandidatos = () => {
  const [paginaSelecionada, setPaginaSelecionada] = useState("candidatos");

  const renderizarConteudo = () => {
    switch (paginaSelecionada) {
      case "candidatos":
        return <CandidatosFestivalAdmin />; // 👈 Aqui é a tela com edição
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
