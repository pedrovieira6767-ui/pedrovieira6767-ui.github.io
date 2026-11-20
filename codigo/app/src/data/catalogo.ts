export type SistemaId =
  | 'sangue' | 'cardio' | 'figado' | 'rins' | 'glicose' | 'ferro' | 'hormonios' | 'ossos' | 'imunidade' | 'outros';

export const SISTEMAS: Record<SistemaId, { nome: string; chip: string; cor: string }> = {
  sangue: { nome: 'Sangue · Hemograma', chip: 'Sangue', cor: '#dc2626' },
  cardio: { nome: 'Coração e vasos', chip: 'Coração', cor: '#db2777' },
  figado: { nome: 'Fígado', chip: 'Fígado', cor: '#d97706' },
  rins: { nome: 'Rins', chip: 'Rins', cor: '#2563eb' },
  glicose: { nome: 'Pâncreas · Glicose', chip: 'Glicose', cor: '#16a34a' },
  ferro: { nome: 'Ferro · Estoques', chip: 'Ferro', cor: '#0d9488' },
  hormonios: { nome: 'Tireoide e hormônios', chip: 'Hormônios', cor: '#4f46e5' },
  ossos: { nome: 'Ossos e minerais', chip: 'Ossos', cor: '#7c3aed' },
  imunidade: { nome: 'Imunidade e sorologias', chip: 'Imunidade', cor: '#0284c7' },
  outros: { nome: 'Outros', chip: 'Outros', cor: '#64748b' },
};

export const ORDEM_SISTEMAS: SistemaId[] = [
  'cardio', 'glicose', 'figado', 'rins', 'ferro', 'sangue', 'hormonios', 'ossos', 'imunidade', 'outros',
];

/** Parâmetros conhecidos: nome de exibição e sistema. */
export const PARAMS: Record<string, { nome: string; sistema: SistemaId }> = {
  eritrocitos: { nome: 'Eritrócitos', sistema: 'sangue' },
  hemoglobina: { nome: 'Hemoglobina', sistema: 'sangue' },
  hematocrito: { nome: 'Hematócrito', sistema: 'sangue' },
  vcm: { nome: 'VCM', sistema: 'sangue' },
  leucocitos: { nome: 'Leucócitos', sistema: 'sangue' },
  linfocitos: { nome: 'Linfócitos', sistema: 'sangue' },
  plaquetas: { nome: 'Plaquetas', sistema: 'sangue' },
  vitamina_b12: { nome: 'Vitamina B12', sistema: 'sangue' },
  colesterol_total: { nome: 'Colesterol total', sistema: 'cardio' },
  ldl: { nome: 'LDL', sistema: 'cardio' },
  hdl: { nome: 'HDL', sistema: 'cardio' },
  nao_hdl: { nome: 'Não-HDL', sistema: 'cardio' },
  triglicerides: { nome: 'Triglicerídeos', sistema: 'cardio' },
  pcr_us: { nome: 'PCR ultrassensível', sistema: 'cardio' },
  tgo: { nome: 'TGO (AST)', sistema: 'figado' },
  tgp: { nome: 'TGP (ALT)', sistema: 'figado' },
  ggt: { nome: 'GGT', sistema: 'figado' },
  creatinina: { nome: 'Creatinina', sistema: 'rins' },
  tfg: { nome: 'TFG estimada', sistema: 'rins' },
  ureia: { nome: 'Ureia', sistema: 'rins' },
  acido_urico: { nome: 'Ácido úrico', sistema: 'rins' },
  glicose: { nome: 'Glicose em jejum', sistema: 'glicose' },
  hba1c: { nome: 'Hemoglobina glicada', sistema: 'glicose' },
  ferritina: { nome: 'Ferritina', sistema: 'ferro' },
  ferro: { nome: 'Ferro sérico', sistema: 'ferro' },
  tsh: { nome: 'TSH', sistema: 'hormonios' },
  t4_livre: { nome: 'T4 livre', sistema: 'hormonios' },
  sodio: { nome: 'Sódio', sistema: 'ossos' },
  potassio: { nome: 'Potássio', sistema: 'ossos' },
  calcio: { nome: 'Cálcio', sistema: 'ossos' },
  vitamina_d: { nome: 'Vitamina D', sistema: 'ossos' },
  anti_hbs: { nome: 'Anti-HBs (hepatite B)', sistema: 'imunidade' },
  hiv: { nome: 'HIV 1 e 2', sistema: 'imunidade' },
};

export type Prioridade = 'p' | 'r' | 's';
export const PRIORIDADE: Record<Prioridade, string> = { p: 'Prioridade', r: 'Rotina', s: 'Se indicado' };

export type ItemLista = { nome: string; motivo: string; pri: Prioridade; sexo?: 'F' | 'M'; idadeMin?: number };

/** Check-up inicial: a base comum que permite acompanhar e comparar. */
export const CHECKUP: { grupo: string; itens: ItemLista[] }[] = [
  {
    grupo: 'Base para todos os adultos',
    itens: [
      { nome: 'Hemograma completo', motivo: 'Anemia, infecções, plaquetas.', pri: 'p' },
      { nome: 'Glicemia de jejum + hemoglobina glicada', motivo: 'Diabetes e pré-diabetes.', pri: 'p' },
      { nome: 'Perfil lipídico', motivo: 'Colesterol total, HDL, LDL, não-HDL e triglicerídeos.', pri: 'p' },
      { nome: 'Lipoproteína(a)', motivo: 'Uma vez na vida.', pri: 'p' },
      { nome: 'Creatinina (com TFG), ureia e ácido úrico', motivo: 'Rins.', pri: 'p' },
      { nome: 'TGO, TGP e GGT', motivo: 'Fígado.', pri: 'p' },
      { nome: 'TSH e T4 livre', motivo: 'Tireoide.', pri: 'p' },
      { nome: 'Ferritina e ferro sérico', motivo: 'Estoques de ferro (falta ou excesso).', pri: 'p' },
      { nome: 'Sódio, potássio e cálcio', motivo: 'Eletrólitos.', pri: 'r' },
      { nome: 'Urina tipo 1 (EAS)', motivo: 'Rins e vias urinárias.', pri: 'r' },
      { nome: 'HIV, sífilis, hepatite B (HBsAg + anti-HBs) e hepatite C', motivo: 'Pelo menos uma vez na vida; anti-HBs mostra se precisa vacinar.', pri: 'p' },
      { nome: 'PCR ultrassensível', motivo: 'Opcional: ajuda no risco cardiovascular.', pri: 's' },
    ],
  },
  {
    grupo: 'Conforme sexo e idade',
    itens: [
      { nome: 'Papanicolau', motivo: 'Dos 25 aos 64 anos, com o ginecologista.', pri: 's', sexo: 'F', idadeMin: 25 },
      { nome: 'Mamografia', motivo: 'A partir dos 40–50 anos, conforme orientação médica.', pri: 's', sexo: 'F', idadeMin: 40 },
      { nome: 'Conversa sobre PSA', motivo: 'Decisão compartilhada com o médico (45 com histórico familiar).', pri: 's', sexo: 'M', idadeMin: 45 },
      { nome: 'Sangue oculto nas fezes ou colonoscopia', motivo: 'Rastreio de câncer de intestino.', pri: 's', idadeMin: 45 },
    ],
  },
];
