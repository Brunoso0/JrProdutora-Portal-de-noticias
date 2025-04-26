import React from "react";
import TopoFestival from "../components/TopoFestival";
import RegrasFestival from "../components/RegrasFestival";
import BandeirolasIntermediarias from "../components/BandeirolasIntermediarias";
import SecaoInscricao from "../components/SecaoInscricao";
import RodapeFestival from "../components/RodapeFestival";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import "../styles/FestivalMusica.css"; // Importando o CSS específico para a página

const FestivalMusica = () => (
  <div className="festival-container">
    <TopoFestival />
    <RegrasFestival />
    <BandeirolasIntermediarias />
    <SecaoInscricao />
    <RodapeFestival />

    <ToastContainer
     position="top-center" 
     autoClose={3000} 
     hideProgressBar 
     pauseOnHover
      draggable
      theme="colored"
     />
  </div>
);

export default FestivalMusica;
