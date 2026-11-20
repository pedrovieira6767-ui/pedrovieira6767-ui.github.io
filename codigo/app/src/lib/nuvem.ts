// Integração com o Supabase. Ativa quando EXPO_PUBLIC_SUPABASE_URL e
// EXPO_PUBLIC_SUPABASE_ANON_KEY estão definidas (arquivo .env).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { SistemaId } from '@/data/catalogo';
import type { Nivel, Pessoa, Resultado, Sexo } from '@/lib/saude';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const nuvemConfigurada = Boolean(URL && KEY);

let _sb: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!nuvemConfigurada) throw new Error('Supabase não configurado');
  if (!_sb) {
    _sb = createClient(URL!, KEY!, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    });
  }
  return _sb;
}

// ---------- Autenticação (e-mail e senha) ----------
export async function criarConta(email: string, senha: string) {
  const { data, error } = await sb().auth.signUp({ email, password: senha });
  if (error) throw error;
  return { precisaConfirmar: !data.session };
}
export async function entrar(email: string, senha: string) {
  const { error } = await sb().auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error(error.message.includes('confirm') ? 'Confirme seu e-mail pelo link que enviamos e tente de novo.' : 'E-mail ou senha incorretos.');
}
export async function usuarioAtual(): Promise<string | null> {
  const { data } = await sb().auth.getUser();
  return data.user?.id ?? null;
}
export async function sair() {
  await sb().auth.signOut();
}

// ---------- Perfil ----------
type PerfilRow = { id: string; nome: string; sexo: Sexo; nascimento: number | null; cabelo: string; cor: string };

export async function salvarPerfil(p: Omit<PerfilRow, 'id'>, consentiu: boolean) {
  const id = await usuarioAtual();
  if (!id) throw new Error('não autenticado');
  const row: Record<string, unknown> = { id, ...p };
  if (consentiu) row.consentiu_em = new Date().toISOString();
  const { error } = await sb().from('profiles').upsert(row);
  if (error) throw error;
}

// ---------- Leitura de pessoas e resultados ----------
export async function carregarTudo(): Promise<{ euId: string; pessoas: Pessoa[]; resultados: Record<string, Resultado[]> } | null> {
  const euId = await usuarioAtual();
  if (!euId) return null;
  const { data: perfis } = await sb().from('profiles').select('id,nome,sexo,nascimento,cabelo,cor');
  const { data: conns } = await sb().from('connections').select('id,a,b,nivel_a,nivel_b');
  const pessoas: Pessoa[] = (perfis ?? []).map((p: PerfilRow) => {
    if (p.id === euId) return { ...p, nivelRecebido: 'tudo' as Nivel };
    const c = (conns ?? []).find((x) => x.a === p.id || x.b === p.id);
    const recebido = (c ? (c.a === p.id ? c.nivel_a : c.nivel_b) : 'nada') as Nivel;
    const enviado = (c ? (c.a === euId ? c.nivel_a : c.nivel_b) : 'nada') as Nivel;
    return { ...p, nivelRecebido: recebido, nivelEnviado: enviado, conexaoId: c?.id } as Pessoa;
  });
  const { data: rs } = await sb()
    .from('results')
    .select('owner,codigo,nome,valor,valor_texto,unidade,ref_min,ref_max,sistema,exams!inner(coletado_em,status)')
    .eq('exams.status', 'confirmado');
  const resultados: Record<string, Resultado[]> = {};
  for (const r of (rs ?? []) as any[]) {
    (resultados[r.owner] ??= []).push({
      codigo: r.codigo,
      nome: r.nome,
      sistema: r.sistema as SistemaId,
      valor: r.valor,
      valorTexto: r.valor_texto,
      unidade: r.unidade,
      refMin: r.ref_min,
      refMax: r.ref_max,
      data: r.exams?.coletado_em ?? new Date().toISOString().slice(0, 10),
    });
  }
  return { euId, pessoas, resultados };
}

// ---------- Envio do laudo (leitura gratuita feita no aparelho) ----------
export async function salvarLeitura(arquivo: { uri: string; name: string; mimeType?: string | null }, coletadoEm: string | null, resultados: Resultado[]) {
  const id = await usuarioAtual();
  if (!id) throw new Error('não autenticado');
  const ext = (arquivo.name.split('.').pop() || 'pdf').toLowerCase();
  const path = `${id}/${Date.now()}.${ext}`;
  const blob = await (await fetch(arquivo.uri)).blob();
  const up = await sb().storage.from('laudos').upload(path, blob, { contentType: arquivo.mimeType ?? 'application/pdf' });
  if (up.error) throw up.error;
  const { data: exam, error } = await sb().from('exams')
    .insert({ owner: id, arquivo_path: path, coletado_em: coletadoEm, status: 'confirmado' }).select('id').single();
  if (error) throw error;
  const rows = resultados.map((r) => ({
    exam_id: exam.id, owner: id, codigo: r.codigo, nome: r.nome, valor: r.valor, valor_texto: r.valorTexto ?? null,
    unidade: r.unidade ?? null, ref_min: r.refMin ?? null, ref_max: r.refMax ?? null, sistema: r.sistema,
  }));
  if (rows.length) {
    const { error: e2 } = await sb().from('results').insert(rows);
    if (e2) throw e2;
  }
  return exam.id as string;
}

// ---------- Leitura com IA (opcional, paga: função ler-laudo + API do Claude) ----------

export async function enviarLaudo(arquivo: { uri: string; name: string; mimeType?: string | null }) {
  const id = await usuarioAtual();
  if (!id) throw new Error('não autenticado');
  const ext = (arquivo.name.split('.').pop() || 'pdf').toLowerCase();
  const path = `${id}/${Date.now()}.${ext}`;
  const blob = await (await fetch(arquivo.uri)).blob();
  const up = await sb().storage.from('laudos').upload(path, blob, { contentType: arquivo.mimeType ?? undefined });
  if (up.error) throw up.error;
  const { data: exam, error } = await sb().from('exams').insert({ owner: id, arquivo_path: path }).select('id').single();
  if (error) throw error;
  const fn = await sb().functions.invoke('ler-laudo', { body: { exam_id: exam.id } });
  if (fn.error) throw fn.error;
  return exam.id as string;
}

export async function resultadosDoExame(examId: string): Promise<Resultado[]> {
  const { data: ex } = await sb().from('exams').select('coletado_em').eq('id', examId).single();
  const { data } = await sb().from('results').select('*').eq('exam_id', examId);
  return ((data ?? []) as any[]).map((r) => ({
    codigo: r.codigo, nome: r.nome, sistema: r.sistema, valor: r.valor, valorTexto: r.valor_texto,
    unidade: r.unidade, refMin: r.ref_min, refMax: r.ref_max, data: ex?.coletado_em ?? new Date().toISOString().slice(0, 10),
  }));
}

export async function confirmarExame(examId: string) {
  const { error } = await sb().from('exams').update({ status: 'confirmado' }).eq('id', examId);
  if (error) throw error;
}

export async function descartarExame(examId: string) {
  await sb().from('exams').delete().eq('id', examId);
}

// ---------- Conexões ----------
export async function criarConvite(): Promise<string> {
  const { data, error } = await sb().rpc('criar_convite');
  if (error) throw error;
  return data as string;
}
export async function aceitarConvite(code: string) {
  const { error } = await sb().rpc('aceitar_convite', { p_code: code });
  if (error) throw error;
}
export async function definirNivel(conexaoId: string, nivel: Nivel) {
  const { error } = await sb().rpc('definir_nivel', { p_conexao: conexaoId, p_nivel: nivel });
  if (error) throw error;
}
export async function removerConexao(conexaoId: string) {
  await sb().from('connections').delete().eq('id', conexaoId);
}

// ---------- Apagar conta ----------
export async function apagarMeusDados() {
  const id = await usuarioAtual();
  if (!id) return;
  const { data: files } = await sb().storage.from('laudos').list(id);
  if (files?.length) await sb().storage.from('laudos').remove(files.map((f) => `${id}/${f.name}`));
  await sb().from('profiles').delete().eq('id', id); // cascata apaga exames, resultados e conexões
  await sair();
}
