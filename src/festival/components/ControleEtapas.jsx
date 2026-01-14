import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ModalIniciarSessao from "./ModalIniciarSessao";
import ModalGerenciarSessao from "./ModalGerenciarSessao";
import "../styles/ControleEtapas.css";
import etapasService from "../../services/EtapasService";
import sessionService from "../../services/SessionServiceV2";

const ControleEtapas = () => {
  const [etapas, setEtapas] = useState([]);
  const [sessaoAtiva, setSessaoAtiva] = useState(null);
  const [isIniciarModalOpen, setIniciarModalOpen] = useState(false);
  const [isGerenciarModalOpen, setGerenciarModalOpen] = useState(false);
  const [etapaSelecionada, setEtapaSelecionada] = useState(null);

  // Renomeando para função mais genérica
  const carregarDadosDaTela = async () => {
    try {
      console.log("Recarregando DADOS da Tela");

      const resultadoEtapas = await etapasService.listarEtapas();
      console.log("DEBUG resultadoEtapas:", resultadoEtapas);

      // Normaliza possíveis formatos de resposta: `data` ou `etapas`
      const lista =
        Array.isArray(resultadoEtapas?.data)
          ? resultadoEtapas.data
          : Array.isArray(resultadoEtapas?.etapas)
          ? resultadoEtapas.etapas
          : [];

      if (lista.length) {
        setEtapas(lista.sort((a, b) => Number(a.id) - Number(b.id)));
        console.log("Etapas carregadas:", lista.length);
      } else {
        console.warn("Resposta de etapas vazia ou formato inesperado:", resultadoEtapas);
        setEtapas([]);
      }

      const resultadoSessao = await sessionService.getSessaoAtiva();
      console.log("DEBUG resultadoSessao:", resultadoSessao);
      if (resultadoSessao?.success && resultadoSessao.data) {
        setSessaoAtiva(resultadoSessao.data);
        console.log("Sessão ativa encontrada:", resultadoSessao.data.id);
      } else {
        setSessaoAtiva(null);
        console.log("Nenhuma sessão ativa");
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Não foi possivel carregar os dados da página.");
    }
  };

  useEffect(() => {
    carregarDadosDaTela();
  }, []);

  // Funções que abrem os modais
  const handleAbrirModalIniciar = (etapa) => {
    if (sessaoAtiva) {
      toast.warn("Já existe uma sessão em andamento. Encerre-a antes de iniciar uma nova.");
      return;
    }
    setEtapaSelecionada(etapa);
    setIniciarModalOpen(true);
  };

  const handleAbrirModalGerenciar = () => {
    setGerenciarModalOpen(true);
  };

  return (
    <div className="controle-etapas">
      <h2>Controle de Etapas</h2>
      <ul className="lista-etapas">
        {etapas.map((etapa) => {
          const isSessaoAtivaNestaEtapa = sessaoAtiva && sessaoAtiva.etapa_id === etapa.id;

          return (
            <li key={etapa.id} className="etapa-item">
              <div>
                <strong>{etapa.nome}</strong><br />
                <span>Status da votação:{" "}
                  <strong style={{ color: isSessaoAtivaNestaEtapa ? "#2ecc71" : "#e74c3c" }}>
                    {isSessaoAtivaNestaEtapa ? `Aberta (${sessaoAtiva.descricao})` : "Fechada"}
                  </strong>
                </span>
              </div>
              {isSessaoAtivaNestaEtapa ? (
                <button className="botao-status gerenciar" onClick={handleAbrirModalGerenciar}>
                  Gerenciar Sessão Atual
                </button>
              ) : (
                <button
                  className={`botao-status liberar ${sessaoAtiva ? 'disabled' : ''}`}
                  onClick={() => handleAbrirModalIniciar(etapa)}
                  disabled={!!sessaoAtiva}
                >
                  Iniciar Sessão
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Os componentes de Modal que serão criados */}
      {isIniciarModalOpen && (
        <ModalIniciarSessao
          etapa={etapaSelecionada}
          onClose={() => setIniciarModalOpen(false)}
          onSuccess={() => {
            setIniciarModalOpen(false);
            carregarDadosDaTela();
          }}
        />
      )}
      {isGerenciarModalOpen && (
        <ModalGerenciarSessao
          sessao={sessaoAtiva}
          onClose={() => setGerenciarModalOpen(false)}
          onSuccess={() => {
            setGerenciarModalOpen(false);
            carregarDadosDaTela();
          }}
        />
      )}
    </div>
  );
};

export default ControleEtapas;
