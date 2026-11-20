// Dados FICTÍCIOS usados no modo demonstração. Nenhum dado real.
import { PARAMS } from '@/data/catalogo';
import type { Pessoa, Resultado } from '@/lib/saude';

type Linha = [codigo: string, valor: number | null, unidade: string, refMin: number | null, refMax: number | null, texto?: string];

function coleta(data: string, linhas: Linha[]): Resultado[] {
  return linhas.map(([codigo, valor, unidade, refMin, refMax, texto]) => ({
    codigo,
    nome: PARAMS[codigo]?.nome ?? codigo,
    sistema: PARAMS[codigo]?.sistema ?? 'outros',
    valor,
    valorTexto: texto ?? null,
    unidade,
    refMin,
    refMax,
    data,
  }));
}

export const DEMO_EU_ID = 'eu';

export const DEMO_PESSOAS: Pessoa[] = [
  { id: DEMO_EU_ID, nome: 'Lucas', sexo: 'M', nascimento: 1996, cabelo: '#2f2118', cor: '#2f6fde', nivelRecebido: 'tudo' },
  { id: 'marina', nome: 'Marina', sexo: 'F', nascimento: 1998, cabelo: '#6b3f22', cor: '#d4407a', nivelRecebido: 'tudo', nivelEnviado: 'tudo' },
  { id: 'rafael', nome: 'Rafael', sexo: 'M', nascimento: 1967, cabelo: '#9ca3af', cor: '#0d9488', nivelRecebido: 'resumo', nivelEnviado: 'resumo' },
];

const baseM = (ldl: number, hdl: number, tg: number, glic: number, ferritina: number, vitd: number): Linha[] => [
  ['hemoglobina', 15.4, 'g/dL', 13.5, 17.5], ['hematocrito', 46.1, '%', 39, 50], ['leucocitos', 6100, '/mm³', 3500, 10500],
  ['linfocitos', 2100, '/mm³', 900, 2900], ['plaquetas', 221, 'mil/mm³', 150, 450],
  ['colesterol_total', Math.round(ldl + hdl + tg / 5), 'mg/dL', null, 190], ['ldl', ldl, 'mg/dL', null, 115], ['hdl', hdl, 'mg/dL', 40, null],
  ['nao_hdl', Math.round(ldl + tg / 5), 'mg/dL', null, 145], ['triglicerides', tg, 'mg/dL', null, 150],
  ['glicose', glic, 'mg/dL', 70, 99], ['tgo', 22, 'U/L', 11, 39], ['tgp', 27, 'U/L', 11, 45], ['ggt', 31, 'U/L', 7, 58],
  ['creatinina', 1.02, 'mg/dL', 0.7, 1.2], ['ureia', 34, 'mg/dL', 15, 45], ['acido_urico', 5.6, 'mg/dL', 2.5, 7],
  ['ferritina', ferritina, 'ng/mL', 22, 322], ['ferro', 98, 'µg/dL', 65, 170], ['tsh', 2.1, 'µUI/mL', 0.38, 5.33],
  ['t4_livre', 1.08, 'ng/dL', 0.54, 1.24], ['calcio', 9.6, 'mg/dL', 8.8, 11], ['sodio', 140, 'mEq/L', 135, 144],
  ['potassio', 4.4, 'mEq/L', 3.5, 5.5], ['vitamina_d', vitd, 'ng/mL', 20, 60],
];

export const DEMO_RESULTADOS: Record<string, Resultado[]> = {
  [DEMO_EU_ID]: [
    ...coleta('2026-02-10', [...baseM(158, 44, 182, 104, 390, 19), ['hba1c', 5.8, '%', null, 5.7]]),
    ...coleta('2026-09-15', [...baseM(132, 49, 128, 95, 300, 27), ['hba1c', 5.5, '%', null, 5.7], ['anti_hbs', null, '', null, null, 'Reagente (protegido)']]),
  ],
  marina: [
    ...coleta('2026-03-02', [
      ['hemoglobina', 12.6, 'g/dL', 12, 15.5], ['hematocrito', 37.9, '%', 35, 45], ['leucocitos', 7300, '/mm³', 3500, 10500],
      ['linfocitos', 2400, '/mm³', 900, 2900], ['plaquetas', 260, 'mil/mm³', 150, 450],
      ['colesterol_total', 176, 'mg/dL', null, 190], ['ldl', 98, 'mg/dL', null, 115], ['hdl', 62, 'mg/dL', 40, null],
      ['nao_hdl', 114, 'mg/dL', null, 145], ['triglicerides', 81, 'mg/dL', null, 150], ['glicose', 84, 'mg/dL', 70, 99],
      ['tgo', 18, 'U/L', 10, 37], ['tgp', 15, 'U/L', 10, 37], ['creatinina', 0.74, 'mg/dL', 0.53, 1], ['ureia', 25, 'mg/dL', 15, 45],
      ['ferritina', 14, 'ng/mL', 10, 291], ['ferro', 58, 'µg/dL', 50, 170], ['tsh', 3.9, 'µUI/mL', 0.38, 5.33],
      ['t4_livre', 0.92, 'ng/dL', 0.54, 1.24], ['vitamina_d', 31, 'ng/mL', 20, 60],
    ]),
    ...coleta('2026-10-01', [
      ['hemoglobina', 13.4, 'g/dL', 12, 15.5], ['hematocrito', 40.2, '%', 35, 45], ['leucocitos', 6900, '/mm³', 3500, 10500],
      ['linfocitos', 2200, '/mm³', 900, 2900], ['plaquetas', 248, 'mil/mm³', 150, 450],
      ['colesterol_total', 181, 'mg/dL', null, 190], ['ldl', 101, 'mg/dL', null, 115], ['hdl', 63, 'mg/dL', 40, null],
      ['nao_hdl', 118, 'mg/dL', null, 145], ['triglicerides', 85, 'mg/dL', null, 150], ['glicose', 86, 'mg/dL', 70, 99],
      ['ferritina', 41, 'ng/mL', 10, 291], ['ferro', 92, 'µg/dL', 50, 170], ['tsh', 2.4, 'µUI/mL', 0.38, 5.33],
      ['vitamina_d', 34, 'ng/mL', 20, 60],
    ]),
  ],
  rafael: coleta('2026-08-20', [
    ...baseM(141, 41, 210, 118, 280, 24),
    ['hba1c', 6.1, '%', null, 5.7],
  ]),
};

/** Resultado simulado da "leitura" de um laudo no modo demonstração. */
export function demoLeitura(): Resultado[] {
  const hoje = new Date().toISOString().slice(0, 10);
  return coleta(hoje, [
    ['hemoglobina', 15.1, 'g/dL', 13.5, 17.5], ['ldl', 121, 'mg/dL', null, 115], ['hdl', 51, 'mg/dL', 40, null],
    ['triglicerides', 110, 'mg/dL', null, 150], ['glicose', 92, 'mg/dL', 70, 99], ['hba1c', 5.4, '%', null, 5.7],
    ['ferritina', 260, 'ng/mL', 22, 322], ['vitamina_d', 31, 'ng/mL', 20, 60],
  ]);
}
