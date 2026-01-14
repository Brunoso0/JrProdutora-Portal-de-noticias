import React from "react";

const PrivacidadeModal = ({ onAccept, onDecline }) => {
  return (
    <div className="privacidade-modal-overlay">
      <div className="privacidade-modal-content">
        <h2>Política de Privacidade</h2>

        <div className="privacidade-modal-body">
          <h3>Política de Privacidade</h3>
          <p>
            Ao enviar seu currículo, foto e informações pessoais através do
            nosso sistema, você concorda que os dados fornecidos serão
            utilizados <b>exclusivamente para fins de recrutamento e seleção</b>{" "}
            para as vagas anunciadas em nossa plataforma.
          </p>

          <h4>1. Tipos de Dados Coletados</h4>
          <p>Durante o cadastro, coletamos as seguintes informações:</p>
          <ul>
            <li>Nome completo</li>
            <li>E-mail de contato</li>
            <li>Telefone</li>
            <li>Cargo ou vaga desejada</li>
            <li>Currículo (PDF)</li>
            <li>Imagem pessoal (foto de perfil)</li>
          </ul>

          <h4>2. Uso dos Dados</h4>
          <p>
            Esses dados são utilizados <b>exclusivamente</b> para analisar a
            compatibilidade do(a) candidato(a) com as vagas disponíveis e
            possibilitar o contato para agendamentos ou comunicações
            relacionadas ao processo seletivo.
          </p>

          <h4>3. Compartilhamento dos Dados</h4>
          <p>
            Os dados informados <b>não serão compartilhados com terceiros</b> e{" "}
            <b>não serão utilizados para nenhuma finalidade que não seja o processo seletivo</b>. 
            Somente os responsáveis pela seleção e pela gestão de Recursos Humanos terão acesso aos dados,
            em ambiente seguro e controlado.
          </p>

          <h4>4. Tempo de Armazenamento dos Dados</h4>
          <p>
            Os dados serão armazenados <b>temporariamente</b>, durante o período
            de análise e conclusão do processo seletivo. Os dados serão{" "}
            <b>
              completamente excluídos de nosso sistema em até 30 dias após o
              inicio do processo seletivo
            </b>
            , sem possibilidade de recuperação.
          </p>

          <h4>5. Segurança e Proteção</h4>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger os dados
            contra acessos não autorizados, perdas, alterações ou destruições.
            Nosso sistema utiliza <b>conexões seguras (HTTPS)</b> e
            armazenamento em servidores com acesso restrito.
          </p>

          <h4>6. Direitos do Candidato</h4>
          <p>Você tem o direito de:</p>
          <ul>
            <li>Solicitar informações sobre os dados armazenados.</li>
            <li>
              Solicitar a exclusão antecipada dos dados a qualquer momento,
              antes do prazo final, através de contato direto.
            </li>
          </ul>

          <h4>7. Consentimento</h4>
          <p>
            Ao marcar o campo de aceite da Política de Privacidade e enviar
            seus dados, você <b>concorda integralmente com todos os termos</b>{" "}
            aqui descritos.
          </p>

          <h4>8. Contato</h4>
          <p>
            Para dúvidas ou solicitações relacionadas aos seus dados, entre em
            contato pelo e-mail: <b>contatojrcoffee@provedorjrnet.com.br</b>
          </p>
        </div>

        <div className="privacidade-modal-footer">
          <button
            className="privacidade-modal-btn privacidade-modal-btn-accept"
            onClick={onAccept}
          >
            Concordo
          </button>
          <button
            className="privacidade-modal-btn privacidade-modal-btn-decline"
            onClick={onDecline}
          >
            Não Concordo
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacidadeModal;
