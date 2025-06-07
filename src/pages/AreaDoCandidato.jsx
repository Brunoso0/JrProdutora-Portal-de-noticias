import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import FooterFestival from "../components/FooterFestival";
import { API_FESTIVAL } from "../services/api";
import "../styles/AreaDoCandidato.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const AreaDoCandidato = () => {
  const [candidato, setCandidato] = useState(null);
  const [etapas, setEtapas] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState(null);
  const [notas, setNotas] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [votosBinarios, setVotosBinarios] = useState([]);
  const [pendencias, setPendencias] = useState([]);
  const [mostrarPendencias, setMostrarPendencias] = useState(false);
  const [formData, setFormData] = useState({});
  const [previewFoto, setPreviewFoto] = useState(null);
  const [dadosVotacao, setDadosVotacao] = useState(null);
  const [etapa, setEtapa] = useState(null);

  const coresJurados = ["#9B5DE5", "#F15BB5", "#FBB13C", "#00BBF9", "#46BFDB"];

  const candidatoId = localStorage.getItem("candidatoId");

  useEffect(() => {
    if (!candidatoId) return;

    axios.get(`${API_FESTIVAL}/api/inscricoes/${candidatoId}`)
      .then(res => {
        setCandidato(res.data);
        setFormData({
          nome: res.data.nome || "",
          telefone: res.data.telefone || "",
          nome_artistico: res.data.nome_artistico || "",
          endereco: res.data.endereco || "",
          rg: res.data.rg || "",
          cpf: res.data.cpf || "",
          musica: res.data.musica || "",
          tempo_atividade: res.data.tempo_atividade || "",
          atividade_profissional_musica: res.data.atividade_profissional_musica ? "true" : "false",
          faz_parte_grupo: res.data.faz_parte_grupo ? "true" : "false",
          experiencia: res.data.experiencia || "",
        });

        const camposObrigatorios = [
          "telefone", "rg", "cpf", "musica", "video",
          "rg_arquivo", "cpf_arquivo", "certidao_municipal_arquivo",
          "certidao_federal_arquivo", "comprovante_residencia_arquivo",
          "espelho_conta_bancaria_arquivo", "letra_musica_arquivo"
        ];
        const pend = camposObrigatorios.filter(c => !res.data[c]);
        setPendencias(pend);
      })
      .catch(() => setCandidato(null));

    axios.get(`${API_FESTIVAL}/api/inscricoes/etapas`)
      .then(res => setEtapas(res.data))
      .catch(() => setEtapas([]));
  }, [candidatoId]);


  
useEffect(() => {
  if (!candidato?.id) return;

  const etapaAtual = candidato.fase_atual?.toLowerCase();
  setEtapa(etapaAtual);

  if (etapaAtual === "classificado") {
    setDadosVotacao(null); // limpa dados anteriores para mostrar só a mensagem
    return;
  }

  axios
    .get(`${API_FESTIVAL}/api/dashboard/notas/${candidato.id}/${etapaAtual}`)
    .then((res) => setDadosVotacao(res.data))
    .catch(() => setDadosVotacao(null));
}, [candidato]);

  
  // ...existing code...

  const etapasExibidas = useMemo(() => {
  if (!candidato || !etapas.length) return [];

  // Ordena as etapas por ID antes de filtrar
  const etapasOrdenadas = [...etapas].sort((a, b) => a.id - b.id);

  // Identifica a etapa atual no array ordenado
  const indexAtual = etapasOrdenadas.findIndex(e => e.nome === candidato.fase_atual);

  // Garante que só aparecem até a etapa atual
  return etapasOrdenadas.slice(0, indexAtual + 1);
}, [etapas, candidato]);


useEffect(() => {
  if (!etapas.length || !candidato) return;

  // Ordena as etapas por ID
  const etapasOrdenadas = [...etapas].sort((a, b) => a.id - b.id);
  const etapaFinal = etapasOrdenadas[etapasOrdenadas.length - 1];

  if (
    etapaFinal &&
    candidato.fase_atual &&
    etapaFinal.nome.toLowerCase() === candidato.fase_atual.toLowerCase()
  ) {
    // Se existir "segunda etapa", seleciona ela
    const segundaEtapa = etapasOrdenadas.find(e => e.nome.toLowerCase().includes("segunda etapa"));
    if (segundaEtapa) {
      setEtapaSelecionada(String(segundaEtapa.id));
      return;
    }
  }

  // Caso contrário, seleciona a etapa atual normalmente
  const etapaAtual = etapasOrdenadas.find(e => e.nome === candidato.fase_atual);
  if (etapaAtual) {
    setEtapaSelecionada(String(etapaAtual.id));
  } else if (etapasOrdenadas.length > 0) {
    setEtapaSelecionada(String(etapasOrdenadas[0].id));
  }
}, [etapas, candidato]);



useEffect(() => {
  if (!etapaSelecionada || !candidatoId) return;

  const etapaIdNum = Number(etapaSelecionada);
  const candidatoIdNum = Number(candidatoId);

  console.log("🔍 Requisição:", { etapaIdNum, candidatoIdNum });

  axios
    .get(`${API_FESTIVAL}/api/jurados/votos-binarios/${candidatoIdNum}/${etapaIdNum}`)
    .then((res) => {
      console.log("📥 VOTOS BINÁRIOS RECEBIDOS:", res.data);
      setVotosBinarios(res.data);
    })
    .catch((err) => {
      console.error("❌ Erro ao buscar votos binários:", err);
      setVotosBinarios([]);
    });
}, [etapaSelecionada, candidatoId]);

useEffect(() => {
  if (!etapaSelecionada || !candidatoId) return;

  const etapaIdNum = Number(etapaSelecionada);
  const candidatoIdNum = Number(candidatoId);

  axios
    .get(`${API_FESTIVAL}/api/dashboard/notas/${candidatoIdNum}/${etapaIdNum}`)
    .then((res) => {
      console.log("📊 VOTOS DOS JURADOS (CRITÉRIOS):", res.data);
      setNotas(res.data);
    })
    .catch((err) => {
      console.error("❌ Erro ao buscar votos dos jurados:", err);
      setNotas(null);
    });
}, [etapaSelecionada, candidatoId]);



  const abrirModal = () => setModalAberto(true);
  const fecharModal = () => {
    setModalAberto(false);
    setMostrarPendencias(false);
  };

  const etapaSelecionadaNome = etapas.find(e => e.id === Number(etapaSelecionada))?.nome;

  const corrigirCriterio = (criterio) => {
  const mapa = {
    afinacao: "Afinação",
    ritmo: "Ritmo",
    interpretacao: "Interpretação",
    autenticidade: "Autenticidade",
    "diccao/pronuncia": "Dicção/Pronúncia",
    "presenca de palco": "Presença de Palco",
    // Adicione mais se necessário
  };

  if (!criterio) return "";
  const chave = criterio.toLowerCase();
  return mapa[chave] || criterio.charAt(0).toUpperCase() + criterio.slice(1);
};



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  const name = e.target.name;

  setFormData((prev) => ({ ...prev, [name]: file }));

  if (name === "foto" && file) {
    const previewURL = URL.createObjectURL(file);
    setPreviewFoto(previewURL);
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (let campo in formData) {
      data.append(campo, formData[campo]);
    }

    try {
      await axios.put(`${API_FESTIVAL}/api/inscricoes/${candidatoId}`, data);
      toast.success("Dados atualizados com sucesso!");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      toast.error("Erro ao atualizar seus dados.");
      console.error(err);
    }

  };

  return (
    <div className="area-candidato-container">
      <header className="area-candidato-header">
        <div className="perfil">
          <img
            src={candidato?.foto ? `${API_FESTIVAL}/${candidato.foto.replace(/^\/?uploads/, "uploads")}` : "/img/exemplo-perfil.jpg"}
            alt="Foto perfil"
            className="foto-perfil"
            onError={(e) => (e.target.src = "/img/exemplo-perfil.jpg")}
          />
          <div>
            <h2>{candidato?.nome || "Nome do Candidato"}</h2>
            <p>{candidato?.eliminado ? "❌ Eliminado" : (candidato?.fase_atual || "Fase atual")}</p>
          </div>
        </div>
        <button
          className={`botao-atualizar ${pendencias.length > 0 ? "alerta-pendencia" : ""}`}
          onClick={abrirModal}
        >
          {pendencias.length > 0 ? "⚠ Atualizar meus dados" : "Atualizar meus dados"}
        </button>
      </header>

     <main className="area-candidato-main">
  <h3>Tabela de Notas</h3>

  {candidato?.fase_atual === "classificado" ? (
    <>
      <div className="mensagem-avaliacao">
        ✅ Você foi classificado para a próxima fase.
      </div>
      {/* Display the classificatória table here if the candidate is "classificado" */}
      {votosBinarios.length > 0 && (
        <div className="tabela-notas" style={{ marginTop: "2rem" }}>
          <div className="cabecalho-tabela">
            <span>Jurado</span>
            <span>Status</span>
          </div>
          {votosBinarios
            .filter((v) => v.aprovado === "sim")
            .map((voto, i) => (
              <div key={i} className="linha-criterio">
                <div className="bloco-jurado">
                  <img src={`${API_FESTIVAL}/${voto.foto_jurado}`} alt="jurado" />
                  <strong>{voto.nome_jurado}</strong>
                </div>
                <div className="notas-linha"><span>✅ Aprovado</span></div>
              </div>
            ))}
        </div>
      )}
    </>
  ) : (
    <>
      <p>Escolha a etapa para visualizar:</p>
      <select
        className="select-etapa"
        value={etapaSelecionada || ""}
        onChange={(e) => setEtapaSelecionada(e.target.value)}
      >
        {etapasExibidas
          .filter(etapa =>
            !["classificatoria", "classificados", "primeira fase"].includes(etapa.nome.toLowerCase())
          )
          .map((etapa) => (
            <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>
          ))}
      </select>

      {etapaSelecionadaNome?.toLowerCase() === "classificatória" ? (
        <>
          {["1", 1, true, "true"].includes(candidato?.eliminado) && votosBinarios.some(v => v.aprovado === "nao") ? (
            <div style={{ marginTop: "2rem" }}>
              <p style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#c0392b" }}>
                ❌ Você foi eliminado nesta etapa. Veja abaixo o motivo:
              </p>
              {votosBinarios
                .filter(v => v.aprovado === "nao")
                .map((voto, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#ffe6e6",
                      border: "1px solid #f5c6cb",
                      padding: "1rem",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
                      marginBottom: "1rem",
                      width: "15%",
                      margin: "0 auto",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={`${API_FESTIVAL}/${voto.foto_jurado}`}
                      alt={voto.nome_jurado}
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #c0392b"
                      }}
                    />
                    <div>
                      <strong style={{ fontSize: "1.05rem" }}>{voto.nome_jurado}</strong>
                      <p style={{ margin: "0.3rem 0", color: "#c0392b" }}>❌ Reprovado</p>
                      <p style={{ fontStyle: "italic", margin: 0 }}>{voto.justificativa || "Sem justificativa informada"}</p>
                    </div>
                  </div>
                ))}
            </div>
          ) : votosBinarios.length > 0 ? (
            <div className="tabela-notas" style={{ marginTop: "2rem" }}>
              <div className="cabecalho-tabela">
                <span>Jurado</span>
                <span>Status</span>
              </div>
              {votosBinarios
                .filter((v) => v.aprovado === "sim")
                .map((voto, i) => (
                  <div key={i} className="linha-criterio">
                    <div className="bloco-jurado">
                      <img src={`${API_FESTIVAL}/${voto.foto_jurado}`} alt="jurado" />
                      <strong>{voto.nome_jurado}</strong>
                    </div>
                    <div className="notas-linha"><span>✅ Aprovado</span></div>
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ marginTop: "2rem", fontWeight: "bold", color: "#7d27db" }}>
              Você ainda será avaliado, aguarde...
            </p>
          )}
        </>
      ) : (
        notas?.jurados?.length > 0 ? (
          <div className="tabela-candidato-votos">
            <div className="tabela-candidato-linha-titulo">
              <div className="tabela-candidato-celula tabela-candidato-jurado-nome">Jurado</div>
              {notas.jurados[0]?.criterios.map((c, i) => (
                <div key={i} className="tabela-candidato-celula">
                  {corrigirCriterio(c.criterio)}

                </div>
              ))}
              <div className="tabela-candidato-celula tabela-candidato-media-final">Média</div>
            </div>

            {notas.jurados.map((jurado, i) => {
              const total = jurado.criterios.reduce((soma, c) => soma + Number(c.nota || 0), 0);
              const media = total / jurado.criterios.length;

              return (
                <div
                  key={i}
                  className="tabela-candidato-linha-jurado"
                  style={{ backgroundColor: coresJurados[i % coresJurados.length] }}
                >

                  <div className="tabela-candidato-celula tabela-candidato-jurado-nome">
                    {/* <img
                      src={`${API_FESTIVAL}/${jurado.foto_jurado}`}
                      alt="jurado"
                      style={{ width: "40px", borderRadius: "50%", marginRight: "8px" }}
                    /> */}
                    <span>{jurado.nome_jurado}</span>
                  </div>
                  {jurado.criterios.map((c, j) => (
                    <div key={j} className="tabela-candidato-celula" style={{ position: "relative" }}>
                    {c.nota ?? "--"}
                    {c.justificativa?.trim() && (
                      <span className="tooltip-icone">
                        ⓘ
                        <div className="tooltip-conteudo">{c.justificativa}</div>
                      </span>
                    )}
                  </div>

                  ))}
                  <div className="tabela-candidato-celula tabela-candidato-media-final">{media.toFixed(1)}</div>
                </div>
              );
            })}

            <div className="tabela-candidato-linha-titulo tabela-candidato-media-geral">
              <div className="tabela-candidato-celula tabela-candidato-jurado-nome"><strong>MÉDIA GERAL</strong></div>
              {[...Array(notas.jurados[0]?.criterios.length || 0)].map((_, i) => (
                <div className="tabela-candidato-celula" key={i}>–</div>
              ))}
              <div className="tabela-candidato-celula tabela-candidato-media-final">
                <strong>
                  {(
                    notas.jurados.reduce((soma, jurado) =>
                      soma + jurado.criterios.reduce((s, c) => s + Number(c.nota || 0), 0) / jurado.criterios.length,
                      0
                    ) / notas.jurados.length
                  ).toFixed(1)}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ marginTop: "2rem", fontWeight: "bold", color: "#7d27db" }}>
            Você ainda será avaliado(a), aguarde...
          </p>
        )


      )}
    </>
  )}
</main>



      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
        <div className="modal-content-usuario" onClick={(e) => e.stopPropagation()}>

            <h3>Atualizar Meus Dados</h3>

            <form onSubmit={handleSubmit} encType="multipart/form-data">
              {/* ✅ Atualizar imagem de perfil */}
              <div className="atualizar-foto-container">
                <label htmlFor="foto" className="label-foto-atual">
                  Foto de Perfil Atual:
                </label>
                <div className="preview-foto-perfil">
                  <img
                    src={
                      previewFoto
                        ? previewFoto
                        : candidato?.foto
                        ? `${API_FESTIVAL}/${candidato.foto.replace(/^\/?uploads/, "uploads")}`
                        : "/img/exemplo-perfil.jpg"
                    }
                    alt="Foto de perfil"
                    className="foto-preview-atual"
                  />

                </div>

                <label htmlFor="nova-foto" className="label-upload-nova-foto">
                  Atualizar Foto de Perfil:
                </label>
                <input
                  type="file"
                  id="nova-foto"
                  name="foto"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <input name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Nome" required />
              <input name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="Telefone" />
              <input name="nome_artistico" value={formData.nome_artistico} onChange={handleInputChange} placeholder="Nome Artístico" />
              <input name="endereco" value={formData.endereco} onChange={handleInputChange} placeholder="Endereço" />
               <input
                  name="email"
                  value={candidato?.email || ""}
                  placeholder="E-mail"
                  readOnly
                  style={{ cursor: "not-allowed", backgroundColor: "#f3f3f3", color: "#888" }}
                />
                <input
                  name="rg"
                  value={formData.rg}
                  placeholder="RG"
                  readOnly={!!formData.rg}
                  onChange={handleInputChange}
                  style={formData.rg ? { cursor: "not-allowed", backgroundColor: "#f3f3f3", color: "#888" } : {}}
                />
                <input
                  name="cpf"
                  value={formData.cpf}
                  placeholder="CPF"
                  readOnly={!!formData.cpf}
                  onChange={handleInputChange}
                  style={formData.cpf ? { cursor: "not-allowed", backgroundColor: "#f3f3f3", color: "#888" } : {}}
                />
               
              <input
               name="musica"
                value={formData.musica}
                onChange={handleInputChange}
                placeholder="Música"
                style={formData.musica ? { cursor: "not-allowed", backgroundColor: "#f3f3f3", color: "#888" } : {}}
                />
              <input name="tempo_atividade" value={formData.tempo_atividade} onChange={handleInputChange} placeholder="Tempo de Atividade" />
              

              {mostrarPendencias && (
                <>
                  {pendencias.length === 0 ? (
                    <p style={{ color: "green", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span></span>
                    </p>
                  ) : (
                    <>
                      {pendencias.includes("foto") && (
                        <label>Nova Foto: <input type="file" name="foto" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("video") && (
                        <label>Vídeo: <input type="file" name="video" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("rg_arquivo") && (
                        <label>RG: <input type="file" name="rg_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("cpf_arquivo") && (
                        <label>CPF: <input type="file" name="cpf_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("certidao_municipal_arquivo") && (
                        <label>Certidão Municipal: <input type="file" name="certidao_municipal_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("certidao_federal_arquivo") && (
                        <label>Certidão Federal: <input type="file" name="certidao_federal_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("comprovante_residencia_arquivo") && (
                        <label>Comprovante de Residência: <input type="file" name="comprovante_residencia_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("espelho_conta_bancaria_arquivo") && (
                        <label>Espelho da Conta Bancária: <input type="file" name="espelho_conta_bancaria_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("letra_musica_arquivo") && (
                        <label>Letra da Música: <input type="file" name="letra_musica_arquivo" onChange={handleFileChange} /></label>
                      )}
                    </>
                  )}
                </>
              )}

              <button type="submit">Salvar</button>
            </form>


            <button onClick={(  ) => setMostrarPendencias(p => !p)} style={{ marginTop: "1rem" }}>
              {mostrarPendencias ? "Ocultar Pendências" : "Ver Pendências"}
            </button>

            {mostrarPendencias && (
              <ul style={{ textAlign: "left", marginTop: "0.5rem" }}>
                {pendencias.length === 0
                  ? <li>✅ Você não possui pendências.</li>
                  : pendencias.map((p, i) => <li key={i}>⚠ Documento faltando: {p.replace(/_/g, " ")}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={3000} />
    <FooterFestival />
    </div>
  );
};

export default AreaDoCandidato;
