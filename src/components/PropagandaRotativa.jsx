import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import Propaganda from "./Propaganda";

const PropagandaRotativa = ({ espacoNome, intervalo = 10000 }) => {
  const [anuncios, setAnuncios] = useState([]);
  const [anuncioAtual, setAnuncioAtual] = useState(null);
  const anuncioIndexRef = useRef(0);

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/anuncios/espaco/${encodeURIComponent(espacoNome)}/todos`);
        
        console.log("🧪 Anúncios recebidos:", res.data);
  
        if (Array.isArray(res.data) && res.data.length > 0) {
          setAnuncios(res.data);
          setAnuncioAtual(res.data[0]);
        } else {
          console.warn("⚠️ Nenhum anúncio encontrado.");
          setAnuncios([]);
          setAnuncioAtual(null);
        }
  
      } catch (error) {
        console.error("Erro ao buscar anúncios:", error);
      }
    };
  
    fetchAnuncios();
  }, [espacoNome]);
  

  useEffect(() => {
    if (anuncios.length <= 1) return;

    const timer = setInterval(() => {
      anuncioIndexRef.current = (anuncioIndexRef.current + 1) % anuncios.length;
      setAnuncioAtual(anuncios[anuncioIndexRef.current]);
    }, intervalo);

    return () => clearInterval(timer);
  }, [anuncios, intervalo]);

  if (!anuncioAtual) return null;

    return (
    <Propaganda
        tipo={anuncioAtual.tipo}
        imagem={anuncioAtual.imagem}
        link={anuncioAtual.link}
        id={anuncioAtual.google_client_id}
        slot={anuncioAtual.google_slot}
    />
    );
};

export default PropagandaRotativa;
