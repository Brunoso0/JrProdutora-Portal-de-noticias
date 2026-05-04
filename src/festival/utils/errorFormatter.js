/**
 * Mapeia erros técnicos (do backend) para mensagens amigáveis ao usuário
 * Evita expor mensagens de SQL, banco de dados e logs internos
 * @param {Error} error - Objeto de erro do axios ou erro genérico
 * @returns {string} Mensagem formatada e amigável ao usuário
 */
export const formatErrorMessage = (error) => {
  const message = error?.response?.data?.message || error?.message || 'Erro ao processar operação';
  const statusCode = error?.response?.status;

  // Mapeamento de erros técnicos para mensagens amigáveis
  const errorMappings = {
    'birth_date': 'Data de nascimento é obrigatória',
    'artistic_name': 'Nome artístico é obrigatório',
    'name': 'Nome completo é obrigatório',
    'song_name': 'Nome da música é obrigatório',
    'email': 'Email inválido ou já registrado',
    'cpf': 'CPF inválido ou já registrado',
    'rg': 'RG inválido ou já registrado',
    'phone': 'Telefone inválido',
    'password': 'Senha inválida ou muito curta (mínimo 6 caracteres)',
    'current password': 'Senha atual incorreta',
    'profile_photo_url': 'Erro ao salvar a foto do perfil',
    'not null': 'Campo obrigatório não foi preenchido',
    'unique': 'Este valor já foi registrado no sistema',
    'constraint': 'Restrição de dados violada',
    'foreign key': 'Referência de dados inválida',
    'fileReference': 'Erro ao processar o upload da imagem'
  };

  // Verificar se a mensagem contém alguma palavra-chave de erro
  for (const [key, friendlyMessage] of Object.entries(errorMappings)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return friendlyMessage;
    }
  }

  // Tratamento de erros HTTP específicos
  if (statusCode === 401 || statusCode === 403) {
    return 'Credenciais Invalidas, verifique seus dados e tente novamente.';
  }

  if (statusCode === 400) {
    return 'Dados inválidos. Verifique os campos preenchidos.';
  }

  if (statusCode === 404) {
    return 'Recurso não encontrado.';
  }

  if (statusCode >= 500) {
    return 'Erro no servidor. Tente novamente mais tarde.';
  }

  // Mensagem padrão
  return 'Não foi possível completar a operação. Tente novamente.';
};
