import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_FESTIVAL } from '../services/api';
import '../styles/VencedoresFestival2025.css';

const VencedoresFestival2025 = () => {
  const [vencedores, setVencedores] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [mostrar, setMostrar] = useState(false);

  const buscarVencedores = async () => {
    try {
      const res = await axios.get(`${API_FESTIVAL}/api/dashboard/avancos-dia`, {
        params: {
          etapa_id: 5,
          data: dataSelecionada
        }
      });
      setVencedores(res.data);
    } catch (err) {
      console.error('Erro ao buscar vencedores:', err);
    }
  };

  const handleRevelar = () => {
    setMostrar(true);
  };

  return (
    <div className="vencedores-container">
      <h1 className="vencedores-titulo">Vencedores do Festival 2025</h1>

      <div className="vencedores-select-data">
        <input
          type="date"
          value={dataSelecionada}
          onChange={(e) => {
            setDataSelecionada(e.target.value);
            setMostrar(false);
            setVencedores([]);
          }}
        />
      </div>

      {dataSelecionada && !mostrar && (
        <button className="botao-revelar" onClick={() => { buscarVencedores(); handleRevelar(); }}>
          <span>REVELAR VENCEDORES</span>
          <div className="luz-efeito"></div>
        </button>
      )}

      <div className="vencedores-lista linha">
        {mostrar &&
          vencedores
            .slice()
            .reverse()
            .map((v, i) => (
              <div
                key={v.id}
                className={`vencedor-item ${mostrar ? 'visivel' : ''}`}
                style={{ transitionDelay: `${i * 1.2}s` }}
              >
                <img src={`${API_FESTIVAL}/${v.foto}`} alt="Foto do candidato" />
                <div className="vencedor-info">
                  <h2>{v.nome_artistico}</h2>
                  <p className="vencedor-etapa">{v.origem === 'popular' ? 'Voto Popular' : 'Nota dos Jurados'}</p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default VencedoresFestival2025;
