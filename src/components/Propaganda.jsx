import React, { useEffect } from "react";
import { API_BASE_URL } from "../services/api";

const Propaganda = ({ tipo, imagem, link, id, slot }) => {
  useEffect(() => {
    if (tipo === "google") {
      try {
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
        }
      } catch (e) {
        console.error("Erro ao carregar Google Ads:", e);
      }
    }
  }, [tipo]);

  if (tipo === "banner") {
    return (
      <div className="propaganda-banner">
        <a href={link} target="_blank" rel="noopener noreferrer">
        <img src={`${API_BASE_URL}${imagem}`} alt="Propaganda" />
        </a>
      </div>
    );
  }

  if (tipo === "google") {
    return (
      <div className="propaganda-google">
        <ins className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={id}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
      </div>
    );
  }

  return null;
};

export default Propaganda;
