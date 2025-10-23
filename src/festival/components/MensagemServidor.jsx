import React from 'react';
import '../styles/MensagemServidor.css';

const MensagemServidor = ({ 
  titulo = "Servidor Temporariamente Indisponível",
  tipo = "manutencao" // "manutencao", "sobrecarga", "erro"
}) => {
  
  const getMensagemPorTipo = () => {
    switch(tipo) {
      case 'sobrecarga':
        return {
          icon: '⚡',
          descricao: 'O servidor está temporariamente sobrecarregado.',
          detalhes: 'Muitos usuários acessando simultaneamente. Tente novamente em alguns minutos.',
          cor: '#ff9800'
        };
      case 'erro':
        return {
          icon: '🚨',
          descricao: 'Erro interno do servidor detectado.',
          detalhes: 'Nossa equipe foi notificada automaticamente. O problema deve ser resolvido em breve.',
          cor: '#f44336'
        };
      default: // manutencao
        return {
          icon: '🔧',
          descricao: 'O servidor pode estar em manutenção programada.',
          detalhes: 'Atualizações e melhorias estão sendo aplicadas para garantir a melhor experiência.',
          cor: '#2196f3'
        };
    }
  };

  const { icon, descricao, detalhes, cor } = getMensagemPorTipo();

  return (
    <div className="mensagem-servidor" style={{ borderLeftColor: cor }}>
      <div className="mensagem-header">
        <span className="mensagem-icon">{icon}</span>
        <h3>{titulo}</h3>
      </div>
      
      <div className="mensagem-body">
        <p className="descricao">{descricao}</p>
        <p className="detalhes">{detalhes}</p>
        
        <div className="acoes-sugeridas">
          <h4>📋 O que você pode fazer:</h4>
          <ul>
            <li>✅ Aguardar alguns minutos e tentar novamente</li>
            <li>🔄 Recarregar a página usando o botão abaixo</li>
            <li>📊 Acompanhar o status de conexão no topo da tela</li>
            <li>📱 Verificar sua conexão de internet</li>
          </ul>
        </div>

        <div className="info-tecnica">
          <p><strong>Código:</strong> 502 Bad Gateway</p>
          <p><strong>Horário:</strong> {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default MensagemServidor;