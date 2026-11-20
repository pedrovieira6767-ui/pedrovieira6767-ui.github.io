import { PARAMS, SistemaId } from '@/data/catalogo';

export type Sexo = 'F' | 'M';
export type Nivel = 'nada' | 'resumo' | 'tudo';

export type Pessoa = {
  id: string;
  nome: string;
  sexo: Sexo;
  nascimento: number | null;
  cabelo: string;
  cor: string;
  /** O que esta pessoa compartilha comigo (para mim mesmo é sempre 'tudo'). */
  nivelRecebido: Nivel;
  /** O que eu compartilho com esta pessoa (não se aplica a mim). */
  nivelEnviado?: Nivel;
  conexaoId?: string;
};

export type Resultado = {
  codigo: string;
  nome: string;
  sistema: SistemaId;
  valor: number | null;
  valorTexto?: string | null;
  unidade?: string | null;
  refMin?: number | null;
  refMax?: number | null;
  /** Data da coleta, AAAA-MM-DD */
  data: string;
};

export type Status = 'ok' | 'limite' | 'fora' | 'info';

export function statusDe(r: Pick<Resultado, 'valor' | 'refMin' | 'refMax'>): Status {
  const { valor, refMin, refMax } = r;
  if (valor == null) return 'info';
  if (refMax != null && valor > refMax) return 'fora';
  if (refMin != null && valor < refMin) return 'fora';
  if (refMin != null && refMax != null) {
    const w = refMax - refMin;
    if (w > 0 && (valor - refMin < w * 0.05 || refMax - valor < w * 0.05)) return 'limite';
  } else if (refMax != null && valor > refMax * 0.97) {
    return 'limite';
  }
  return 'ok';
}

export const ROTULO: Record<Status, string> = { ok: 'Normal', limite: 'No limite', fora: 'Fora', info: '—' };

/** Série por parâmetro, ordenada por data; o último é o mais recente. */
export type Serie = { codigo: string; atual: Resultado; anteriores: Resultado[] };

export function series(resultados: Resultado[]): Serie[] {
  const m = new Map<string, Resultado[]>();
  for (const r of resultados) {
    const arr = m.get(r.codigo) ?? [];
    arr.push(r);
    m.set(r.codigo, arr);
  }
  return [...m.entries()].map(([codigo, arr]) => {
    arr.sort((a, b) => a.data.localeCompare(b.data));
    return { codigo, atual: arr[arr.length - 1], anteriores: arr.slice(0, -1) };
  });
}

export function contagem(ss: Serie[]) {
  let fora = 0;
  let limite = 0;
  for (const s of ss) {
    const st = statusDe(s.atual);
    if (st === 'fora') fora++;
    else if (st === 'limite') limite++;
  }
  return { total: ss.length, fora, limite };
}

export function ultimaColeta(resultados: Resultado[]): string | null {
  return resultados.reduce<string | null>((m, r) => (m == null || r.data > m ? r.data : m), null);
}

export function idade(nascimento: number | null): number | null {
  return nascimento ? new Date().getFullYear() - nascimento : null;
}

export function nomeParam(codigo: string, fallback?: string) {
  return PARAMS[codigo]?.nome ?? fallback ?? codigo;
}

export const fmt = (v: number) =>
  Number.isInteger(v)
    ? v.toLocaleString('pt-BR')
    : v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

export const dataBR = (iso: string) => {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

export const mesAno = (iso: string) => {
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const [a, m] = iso.split('-');
  return `${meses[Number(m) - 1]}/${a.slice(2)}`;
};

/** "1,05" ou "1.05" digitado → 1.05 */
export function numFromInput(t: string): number | null {
  const s = t.trim().replace(/\s/g, '');
  if (!s) return null;
  const v = s.includes(',') ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s);
  return Number.isFinite(v) ? v : null;
}
