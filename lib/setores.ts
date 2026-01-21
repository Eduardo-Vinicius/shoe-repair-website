export const SETORES = {
  ATENDIMENTO_INICIAL: 'atendimento-inicial',
  SAPATARIA: 'sapataria',
  COSTURA: 'costura',
  LAVAGEM: 'lavagem',
  ACABAMENTO: 'acabamento',
  PINTURA: 'pintura',
  ATENDIMENTO_FINAL: 'atendimento-final',
} as const;

export const SETORES_CORES: Record<string, string> = {
  [SETORES.ATENDIMENTO_INICIAL]: '#2196F3',
  [SETORES.SAPATARIA]: '#FF9800',
  [SETORES.COSTURA]: '#9C27B0',
  [SETORES.LAVAGEM]: '#00BCD4',
  [SETORES.ACABAMENTO]: '#4CAF50',
  [SETORES.PINTURA]: '#F44336',
  [SETORES.ATENDIMENTO_FINAL]: '#4CAF50',
};

export const SETORES_NOMES: Record<string, string> = {
  [SETORES.ATENDIMENTO_INICIAL]: 'Atendimento',
  [SETORES.SAPATARIA]: 'Sapataria',
  [SETORES.COSTURA]: 'Costura',
  [SETORES.LAVAGEM]: 'Lavagem',
  [SETORES.ACABAMENTO]: 'Acabamento',
  [SETORES.PINTURA]: 'Pintura',
  [SETORES.ATENDIMENTO_FINAL]: 'Finalizado',
};

export const MAX_FOTOS = 8;
