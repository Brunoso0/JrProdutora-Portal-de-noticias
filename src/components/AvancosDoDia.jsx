import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import "../styles/AvancosDoDia.css";
import { format } from "date-fns";

const AvancosDoDia = () => {
  const [etapas, setEtapas] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Carregar etapas ao iniciar
  useEffect(() => {
    axios
      .get(`${API_FESTIVAL}/api/dashboard/etapas`)
      .then((res) => setEtapas(res.data))
      .catch((err) => console.error("Erro ao buscar etapas", err));
  }, []);

  // Buscar se há ganhadores/votos para a etapa+data
  useEffect(() => {
    if (!etapaSelecionada || !dataSelecionada) return;

    const carregarAvancos = async () => {
      setLoading(true);
      setErro("");
      try {
        const { data } = await axios.get(
          `${API_FESTIVAL}/api/dashboard/avancos-dia`,
          { params: { etapa_id: etapaSelecionada, data: dataSelecionada } }
        );
        setResultados(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar avanços do dia", err);
        setResultados([]);
        setErro("Não foi possível carregar os dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    carregarAvancos();
  }, [etapaSelecionada, dataSelecionada]);

  const abrirPopup = () => {
    const params = new URLSearchParams({
      etapa_id: String(etapaSelecionada || ""),
      data: String(dataSelecionada || ""),
    });
    const url = `${window.location.origin}/popup-avancos-dia?${params.toString()}`;
    window.open(
      url,
      "_blank",
      "noopener,noreferrer,width=1100,height=720,menubar=no,toolbar=no,location=no,status=no"
    );
  };

  const temResultados = Array.isArray(resultados) && resultados.length > 0;

  return (
    <div className="avancos-container">
      <h2>🎤 Candidatos que Avançam de Fase</h2>

      <div className="filtros-avancos">
        <label>
          Etapa:
          <select
            value={etapaSelecionada}
            onChange={(e) => setEtapaSelecionada(e.target.value)}
          >
            <option value="">Selecione a etapa</option>
            {etapas.map((et) => (
              <option key={et.id} value={et.id}>
                {et.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          Data da votação:
          <input
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
          />
        </label>
      </div>

      {loading && <p>Carregando dados...</p>}

      {!loading && erro && <p className="msg-erro">{erro}</p>}

      {!loading && !erro && (
        <>
          {temResultados ? (
            <div className="acoes-avancos">
              <button className="btn-abrir-popup" onClick={abrirPopup}>
                Abrir popup (pódio)
              </button>
              {/* opcional: mostrar uma notinha */}
              <small className="hint">
                Encontramos resultados para {dataSelecionada}. O popup exibirá os 4 ganhadores.
              </small>
            </div>
          ) : (
            <p>Nenhum voto registrado nesta data.</p>
          )}
        </>
      )}
    </div>
  );
};

export default AvancosDoDia;
