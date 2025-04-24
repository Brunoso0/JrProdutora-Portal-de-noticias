import React from "react";
import TopoFestival from "../components/TopoFestival";
import RegrasFestival from "../components/RegrasFestival";
import BandeirolasIntermediarias from "../components/BandeirolasIntermediarias";
import SecaoInscricao from "../components/SecaoInscricao";
import RodapeFestival from "../components/RodapeFestival";

import "../styles/FestivalMusica.css"; // Importando o CSS específico para a página

const FestivalMusica = () => (
  <div className="festival-container">
    <TopoFestival />
    <RegrasFestival />
    <BandeirolasIntermediarias />
    <SecaoInscricao />
    <RodapeFestival />
  </div>
);

export default FestivalMusica;
