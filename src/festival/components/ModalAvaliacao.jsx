import ModalClassificatoria from "./ModalClassificatoria";
import ModalCriterios from "./ModalCriterios";

const ModalAvaliacao = ({ candidato, onClose, onUpdate }) => {
  const etapaAtual = candidato?.fase_atual?.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  if (!candidato) return null;

  return etapaAtual === "classificatoria" ? (
    <ModalClassificatoria candidato={candidato} onClose={onClose} onUpdate={onUpdate} />
  ) : (
    <ModalCriterios candidato={candidato} onClose={onClose} onUpdate={onUpdate} />
  );
};

export default ModalAvaliacao;
