// Leitor gratuito de laudos: reconhece exames no TEXTO de um laudo em PDF,
// sem servidor e sem API paga. Funciona com o layout comum dos laboratórios
// brasileiros ("NOME........ valor unidade  referência" ou seção + "Resultado....").
import { PARAMS, SistemaId } from '@/data/catalogo';
import type { Resultado, Sexo } from '@/lib/saude';

type Def = { codigo: string; rotulo?: RegExp; secao?: RegExp; absoluto?: boolean; qualitativo?: boolean; sorologia?: boolean };

// Linhas com rótulo + pontilhado
const ROTULOS: Def[] = [
  { codigo: 'eritrocitos', rotulo: /^ERITR[ÓO]CITOS\b/i },
  { codigo: 'hemoglobina', rotulo: /^HEMOGLOBINA(?!\s+GLICADA)\b/i },
  { codigo: 'hematocrito', rotulo: /^HEMAT[ÓO]CRITO/i },
  { codigo: 'vcm', rotulo: /^V\.?C\.?M\b/i },
  { codigo: 'hcm', rotulo: /^H\.?C\.?M\b/i },
  { codigo: 'chcm', rotulo: /^C\.?H\.?C\.?M\b/i },
  { codigo: 'rdw', rotulo: /^R\.?D\.?W\b/i },
  { codigo: 'leucocitos', rotulo: /^LEUC[ÓO]CITOS\s+TOTAIS/i },
  { codigo: 'neutrofilos', rotulo: /^NEUTR[ÓO]FILOS/i, absoluto: true },
  { codigo: 'eosinofilos', rotulo: /^EOSIN[ÓO]FILOS/i, absoluto: true },
  { codigo: 'basofilos', rotulo: /^BAS[ÓO]FILOS/i, absoluto: true },
  { codigo: 'monocitos', rotulo: /^MON[ÓO]CITOS/i, absoluto: true },
  { codigo: 'linfocitos', rotulo: /^LINF[ÓO]CITOS(?!\s+REATIVOS)/i, absoluto: true },
  { codigo: 'plaquetas', rotulo: /^PLAQUETAS/i },
  { codigo: 'vpm', rotulo: /^V\.?P\.?M\b/i },
  { codigo: 'colesterol_total', rotulo: /^COLESTEROL\s+TOTAL/i },
  { codigo: 'hdl', rotulo: /^COLESTEROL\s+HDL/i },
  { codigo: 'ldl', rotulo: /^COLESTEROL\s+LDL/i },
  { codigo: 'nao_hdl', rotulo: /^COLESTEROL\s+N[ÃA]O[\s-]?HDL/i },
  { codigo: 'vldl', rotulo: /^COLESTEROL\s+VLDL/i },
  { codigo: 'triglicerides', rotulo: /^TRIGLICER[ÍI]DEOS/i },
  { codigo: 'proteinas_totais', rotulo: /^PROTE[ÍI]NAS\s+TOTAIS/i },
  { codigo: 'albumina', rotulo: /^ALBUMINA(?!\s*\()/i },
  { codigo: 'globulinas', rotulo: /^GLOBULINAS/i },
  { codigo: 'relacao_ag', rotulo: /^RELA[ÇC][ÃA]O\s+A\/G/i },
  { codigo: 'bilirrubina_total', rotulo: /^BILIRRUBINA\s+TOTAL/i },
  { codigo: 'bilirrubina_direta', rotulo: /^BILIRRUBINA\s+DIRETA/i },
  { codigo: 'bilirrubina_indireta', rotulo: /^BILIRRUBINA\s+INDIRETA/i },
  { codigo: 'hba1c', rotulo: /^HEMOGLOBINA\s+GLICADA/i },
  { codigo: 'testosterona_total', rotulo: /^TESTOSTERONA\s+TOTAL/i },
  { codigo: 'testosterona_livre', rotulo: /^TESTOSTERONA\s+LIVRE\s+CALCULADA/i },
  { codigo: 'shbg', rotulo: /^GLOBULINA\s+LIGADORA.*SHBG/i },
  { codigo: 'creatinina', rotulo: /^CREATININA\s*:/i },
];

// Seções (título em maiúsculas) cujo valor vem numa linha "Resultado..." / "Leitura..."
const SECOES: Def[] = [
  { codigo: 'tfg', secao: /ESTIMATIVA DE FILTRA/i },
  { codigo: 'creatinina', secao: /^CREATININA/i },
  { codigo: 'fosfatase_alcalina', secao: /FOSFATASE ALCALINA/i },
  { codigo: 'ferro', secao: /^FERRO S[ÉE]RICO/i },
  { codigo: 'albumina', secao: /^ALBUMINA$/i },
  { codigo: 'acido_urico', secao: /^[ÁA]CIDO [ÚU]RICO/i },
  { codigo: 'calcio', secao: /^C[ÁA]LCIO$/i },
  { codigo: 'ureia', secao: /^UREIA$/i },
  { codigo: 'glicose', secao: /^GLICOSE EM JEJUM/i },
  { codigo: 'magnesio', secao: /^MAGN[ÉE]SIO/i },
  { codigo: 'tgp', secao: /\(TGP\)/i },
  { codigo: 'tgo', secao: /\(TGO\)/i },
  { codigo: 'ggt', secao: /^GGT\b/i },
  { codigo: 'ferritina', secao: /^FERRITINA/i },
  { codigo: 'sodio', secao: /^S[ÓO]DIO$/i },
  { codigo: 'potassio', secao: /^POT[ÁA]SSIO$/i },
  { codigo: 'vitamina_d', secao: /^VITAMINA D/i },
  { codigo: 'vitamina_b12', secao: /^VITAMINA B12/i },
  { codigo: 'tsh', secao: /^TSH\b/i },
  { codigo: 't4_livre', secao: /^T4 LIVRE/i },
  { codigo: 'pcr_us', secao: /PROTE[ÍI]NA C REATIVA/i },
  { codigo: 'anti_tpo', secao: /TIREOPEROXIDASE/i },
  { codigo: 'anti_tg', secao: /^TIREOGLOBULINA, ANTICORPOS/i },
  { codigo: 'toxo_igg', secao: /TOXOPLASMOSE IgG/i, sorologia: true },
  { codigo: 'cmv_igg', secao: /CITOMEGALOV[ÍI]RUS ANTICORPOS IGG/i, sorologia: true },
  { codigo: 'hiv', secao: /^HIV 1 E 2/i, qualitativo: true },
  { codigo: 'htlv', secao: /^HTLV/i, qualitativo: true },
  { codigo: 'hbsag', secao: /^HBSAG$/i, qualitativo: true },
  { codigo: 'anti_hbs', secao: /^HBS, ANTI/i, qualitativo: true },
  { codigo: 'anti_hcv', secao: /^HCV, ANTI/i, qualitativo: true },
  { codigo: 'sifilis_vdrl', secao: /^VDRL$/i, qualitativo: true },
  { codigo: 'toxo_igm', secao: /TOXOPLASMOSE IgM/i, qualitativo: true },
  { codigo: 'cmv_igm', secao: /CITOMEGALOV[ÍI]RUS ANTICORPOS IGM/i, qualitativo: true },
];

const NOMES_EXTRA: Record<string, [string, SistemaId]> = {
  hcm: ['HCM', 'sangue'], chcm: ['CHCM', 'sangue'], rdw: ['RDW', 'sangue'], neutrofilos: ['Neutrófilos', 'sangue'],
  eosinofilos: ['Eosinófilos', 'sangue'], basofilos: ['Basófilos', 'sangue'], monocitos: ['Monócitos', 'sangue'], vpm: ['VPM', 'sangue'],
  vldl: ['VLDL', 'cardio'], proteinas_totais: ['Proteínas totais', 'figado'], albumina: ['Albumina', 'figado'], globulinas: ['Globulinas', 'figado'],
  relacao_ag: ['Relação A/G', 'figado'], bilirrubina_total: ['Bilirrubina total', 'figado'], bilirrubina_direta: ['Bilirrubina direta', 'figado'],
  bilirrubina_indireta: ['Bilirrubina indireta', 'figado'], fosfatase_alcalina: ['Fosfatase alcalina', 'figado'], magnesio: ['Magnésio', 'ossos'],
  testosterona_total: ['Testosterona total', 'hormonios'], testosterona_livre: ['Testosterona livre', 'hormonios'], shbg: ['SHBG', 'hormonios'],
  anti_tpo: ['Anti-TPO', 'hormonios'], anti_tg: ['Anti-tireoglobulina', 'hormonios'], toxo_igg: ['Toxoplasmose IgG', 'imunidade'],
  toxo_igm: ['Toxoplasmose IgM', 'imunidade'], cmv_igg: ['Citomegalovírus IgG', 'imunidade'], cmv_igm: ['Citomegalovírus IgM', 'imunidade'],
  htlv: ['HTLV I e II', 'imunidade'], hbsag: ['HBsAg (hepatite B)', 'imunidade'], anti_hcv: ['Anti-HCV (hepatite C)', 'imunidade'],
  sifilis_vdrl: ['VDRL (sífilis)', 'imunidade'],
};

export function infoParam(codigo: string): { nome: string; sistema: SistemaId } {
  if (PARAMS[codigo]) return PARAMS[codigo];
  const e = NOMES_EXTRA[codigo];
  return e ? { nome: e[0], sistema: e[1] } : { nome: codigo, sistema: 'outros' };
}

/** "1.897" → 1897 · "5,57" → 5.57 · "0,24" → 0.24 */
export function numBR(s: string): number | null {
  const t = s.trim();
  if (!/\d/.test(t)) return null;
  let v: number;
  if (t.includes(',')) v = parseFloat(t.replace(/\./g, '').replace(',', '.'));
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) v = parseFloat(t.replace(/\./g, ''));
  else v = parseFloat(t);
  return Number.isFinite(v) ? v : null;
}

const NUM = String.raw`\d[\d.]*(?:,\d+)?`;
const ehTitulo = (l: string) => {
  const t = l.trim();
  const minus = (t.match(/[a-záéíóúâêôãõç]/g) ?? []).length;
  return t.length >= 3 && t.length <= 70 && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(t) && /^[A-Za-zÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç0-9 ,\-()/.]+$/.test(t) && minus <= 4 && !/\.{3,}/.test(t) && /[A-Z]{3}/.test(t);
};
const nFaixas = (l: string) => [...l.matchAll(new RegExp(`${NUM}\\s*(?:a|A|à|-)\\s*${NUM}`, 'g'))].length;
const linhaIdade = (l: string) => /(^|\s)\d+\s*(a|-|A)\s*\d+\s*(anos|meses|dias|semanas)\b/i.test(l) && !/adult/i.test(l) && nFaixas(l) < 2;

function faixa(l: string): { min: number | null; max: number | null } | null {
  const s = l.replace(/\s+/g, ' ');
  // "entre X e Y"
  let m = s.match(new RegExp(`entre\\s+(${NUM})\\s+e\\s+(${NUM})`, 'i'));
  if (m) return { min: numBR(m[1]), max: numBR(m[2]) };
  // última ocorrência de "X a Y" / "DE X A Y"
  const all = [...s.matchAll(new RegExp(`(${NUM})\\s*(?:a|A|à|-)\\s*(${NUM})`, 'g'))];
  if (all.length) {
    const u = all[all.length - 1];
    return { min: numBR(u[1]), max: numBR(u[2]) };
  }
  m = s.match(new RegExp(`(?:<|inferior a|menor que|at[ée])\\s*(${NUM})`, 'i'));
  if (m) return { min: null, max: numBR(m[1]) };
  m = s.match(new RegExp(`(?:>|superior a|maior que)\\s*(${NUM})`, 'i'));
  if (m) return { min: numBR(m[1]), max: null };
  return null;
}

function escolherRef(linhas: string[], sexo: Sexo): { min: number | null; max: number | null } | null {
  const sx = sexo === 'M' ? /\b(homens?|masculino|homem)\b/i : /\b(mulheres?|feminino|mulher)\b/i;
  const outro = sexo === 'M' ? /\b(mulheres?|feminino|mulher)\b/i : /\b(homens?|masculino|homem)\b/i;
  // junta cabeçalhos sem número ("Homens adultos") com a linha seguinte
  const juntas: string[] = [];
  for (let k = 0; k < linhas.length; k++) {
    const l = linhas[k];
    if ((sx.test(l) || outro.test(l) || /adult/i.test(l)) && !/\d/.test(l) && k + 1 < linhas.length) { juntas.push(l + ' ' + linhas[k + 1]); k++; }
    else juntas.push(l);
  }
  const cands = juntas.filter((l) => (/adult/i.test(l) || !/crian|rec[ée]m|lactente|gr[aá]vid|gestante|trimestre|prematur|cord[ãa]o|pr[ée]-escolar/i.test(l)) && !linhaIdade(l));
  // tabela com colunas Feminino | Masculino ("Adultos  10,0 a 291,0   22,0 a 322,0")
  for (const l of cands) {
    if (/adult/i.test(l) && !sx.test(l) && !outro.test(l)) {
      const r = [...l.matchAll(new RegExp(`(${NUM})\\s*a\\s*(${NUM})`, 'g'))];
      if (r.length === 2) {
        const i = sexo === 'F' ? 0 : 1;
        return { min: numBR(r[i][1]), max: numBR(r[i][2]) };
      }
    }
  }
  const ordem = [
    (l: string) => sx.test(l) && !/\b(50|60|65|70)\s*A\s*\d+\s*ANOS/i.test(l),
    (l: string) => /adult/i.test(l) && !outro.test(l),
    (l: string) => /baixo\s*:/i.test(l),
    (l: string) => /com jejum|desej[áa]vel/i.test(l),
    (l: string) => /popula[çc][ãa]o geral/i.test(l),
    (l: string) => /n[ãa]o reagente/i.test(l),
    (l: string) => !outro.test(l),
  ];
  for (const f of ordem) {
    for (const l of cands) {
      if (f(l)) {
        const r = faixa(l);
        if (r && (r.min != null || r.max != null)) return r;
      }
    }
  }
  return null;
}

export type Leitura = { coletadoEm: string | null; resultados: Resultado[] };

export function lerLaudo(texto: string, sexo: Sexo): Leitura {
  const linhas = texto.split(/\r?\n/).map((l) => l.replace(/ /g, ' ').trimEnd());
  let coletadoEm: string | null = null;
  const achados = new Map<string, Resultado>();
  let secao = '';
  let secaoInicio = 0;

  const dm = texto.match(/Data\s+(?:e\s+hora\s+)?de\s+[Cc]oleta[.:\s]*(\d{2})\/(\d{2})\/(\d{4})/);
  if (dm) coletadoEm = `${dm[3]}-${dm[2]}-${dm[1]}`;
  const data = coletadoEm ?? new Date().toISOString().slice(0, 10);

  const add = (codigo: string, valor: number | null, texto: string | null, unidade: string | null, ref: { min: number | null; max: number | null } | null) => {
    if (achados.has(codigo)) return;
    const info = infoParam(codigo);
    achados.set(codigo, {
      codigo, nome: info.nome, sistema: info.sistema, valor, valorTexto: texto, unidade,
      refMin: ref?.min ?? null, refMax: ref?.max ?? null, data,
    });
  };
  const proximas = (i: number, n = 16) => {
    const out: string[] = [];
    for (let j = i; j < Math.min(linhas.length, i + n); j++) {
      if (j > i && ehTitulo(linhas[j])) break;
      out.push(linhas[j]);
    }
    return out;
  };

  for (let i = 0; i < linhas.length; i++) {
    const bruta = linhas[i];
    const l = bruta.trim();
    if (!l) continue;
    if (/^(Paciente|Unidade|Dr\(a\)|Data da Entrada|Respons[áa]vel|CNES|Liberado|Data resultados anteriores|Resultado Anterior|Leitura Anterior|Data Resultado Anterior)/i.test(l)) continue;
    if (ehTitulo(l)) { secao = l; secaoInicio = i; continue; }
    if (/urina|citometria|exame qu[íi]mico|sedimento/i.test(secao)) continue;

    // 1) linhas "RÓTULO....... valor unidade [referência]"
    const def = ROTULOS.find((d) => d.rotulo!.test(l));
    if (def && /(\.{2,}|:\.)/.test(l)) {
      const resto = l.replace(/^.*?\.{2,}[.:]*/, ' ');
      let valor: number | null = null;
      let unidade: string | null = null;
      let consumido = 0;
      if (def.absoluto) {
        const m = resto.match(new RegExp(`(${NUM})\\s*\\/mm`));
        if (m) { valor = numBR(m[1]); unidade = '/mm³'; }
      } else {
        const m = resto.match(new RegExp(`^\\s*(${NUM})\\s*([^\\s\\d][^\\s]*)?`));
        if (m) { valor = numBR(m[1]); unidade = m[2] ?? null; consumido = m[0].length; }
      }
      if (valor != null) {
        const depois = def.absoluto ? resto.slice(resto.search(/\/mm/) + 3) : resto.slice(consumido);
        let ref = faixa(depois);
        if (!ref || (ref.min == null && ref.max == null)) {
          const seg: string[] = [];
          for (let j = i + 1; j < Math.min(linhas.length, i + 26); j++) {
            const x = linhas[j].trim();
            if (ehTitulo(x) || (ROTULOS.some((d) => d.rotulo!.test(x)) && /\.{2,}/.test(x))) break;
            if (/n[ãa]o h[áa] valor de refer/i.test(x)) { seg.length = 0; break; }
            seg.push(linhas[j]);
          }
          ref = escolherRef(seg, sexo);
        }
        if (unidade === '/' ) unidade = '/mm³';
        add(def.codigo, valor, null, unidade?.replace(/[;,]$/, '') ?? null, ref);
      }
      continue;
    }

    // 2) seção + "Resultado..." ou "Leitura..."
    if (/^(Resultado|RESULTADO|Leitura)\b/.test(l) && secao) {
      const sdef = SECOES.find((d) => d.secao!.test(secao));
      if (!sdef) continue;
      if (/Adulto Negro/i.test(l)) continue;
      if (/^Leitura/i.test(l) && sdef.qualitativo && sdef.codigo !== 'anti_hbs') continue;
      const resto = l.replace(/^[^.:]*[.:]+/, ' ');
      if (sdef.qualitativo) {
        if (sdef.codigo === 'anti_hbs' && /^Leitura/i.test(l)) {
          const m = resto.match(new RegExp(`(?:inferior a\\s*)?(${NUM})`, 'i'));
          const v = m ? numBR(m[1]) : null;
          const prot = v != null && !/inferior/i.test(resto) && v >= 10;
          add('anti_hbs', null, prot ? `${resto.trim().split(/\s{2,}/)[0]} · protegido` : 'Não reagente (< 10)', 'mUI/mL', null);
          continue;
        }
        const t = /n[ãa]o\s*reagente/i.test(resto) ? 'Não reagente' : /reagente/i.test(resto) ? 'Reagente' : null;
        if (t) add(sdef.codigo, null, t, null, null);
        continue;
      }
      const m = resto.match(new RegExp(`^\\s*(${NUM})\\s*([^\\s\\d][^\\s]*)?`));
      if (!m) continue;
      const valor = numBR(m[1]);
      const unidade = m[2] ?? null;
      const mesma = resto.replace(new RegExp(`^\\s*${NUM}\\s*\\S*`), '');
      const ctx = sdef.codigo === 'tfg' ? [mesma, ...proximas(i + 1, 10)] : [mesma, ...proximas(i + 1, 18), ...linhas.slice(secaoInicio + 1, i)];
      if (sdef.sorologia && valor != null) {
        const corte = ctx.join(' ').match(new RegExp(`(?<!n[ãa]o\\s)reagente[.\\s]*:?\\s*(?:superior ou igual a|maior ou igual a|≥)\\s*(${NUM})`, 'i'));
        const lim = corte ? numBR(corte[1]) : null;
        const reag = lim != null ? valor >= lim : null;
        add(sdef.codigo, null, `${reag == null ? '' : reag ? 'Reagente' : 'Não reagente'} · ${String(valor).replace('.', ',')}${unidade ? ' ' + unidade : ''}`.replace(/^ · /, ''), null, null);
        continue;
      }
      const ref = escolherRef(ctx, sexo);
      add(sdef.codigo, valor, null, unidade, ref);
    }
  }
  return { coletadoEm, resultados: [...achados.values()] };
}
