// Estado do app. Funciona em dois modos:
//  - demonstração: dados fictícios guardados no aparelho (padrão)
//  - nuvem: Supabase (quando configurado e com login)
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEMO_EU_ID, DEMO_PESSOAS, DEMO_RESULTADOS } from '@/data/demo';
import * as nuvem from '@/lib/nuvem';
import type { Nivel, Pessoa, Resultado } from '@/lib/saude';

type Estado = {
  modo: 'demo' | 'nuvem';
  euId: string;
  pessoas: Pessoa[];
  resultados: Record<string, Resultado[]>;
};

type Acoes = {
  carregando: boolean;
  eu: Pessoa | undefined;
  pessoa: (id: string) => Pessoa | undefined;
  salvarPerfil: (p: Pick<Pessoa, 'nome' | 'sexo' | 'nascimento' | 'cabelo' | 'cor'>, consentiu: boolean) => Promise<void>;
  adicionarResultados: (rs: Resultado[]) => Promise<void>;
  definirNivel: (pessoaId: string, nivel: Nivel) => Promise<void>;
  criarConvite: () => Promise<string>;
  aceitarConvite: (codigo: string) => Promise<void>;
  removerConexao: (pessoaId: string) => Promise<void>;
  apagarTudo: () => Promise<void>;
  restaurarDemo: () => Promise<void>;
  recarregar: () => Promise<void>;
};

const CHAVE = 'ampla.demo.v1';
const inicialDemo = (): Estado => ({ modo: 'demo', euId: DEMO_EU_ID, pessoas: DEMO_PESSOAS, resultados: DEMO_RESULTADOS });

const Ctx = createContext<(Estado & Acoes) | null>(null);

export function AmplaProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>(inicialDemo);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      if (nuvem.nuvemConfigurada) {
        const dados = await nuvem.carregarTudo();
        if (dados) {
          setEstado({ modo: 'nuvem', ...dados });
          return;
        }
      }
      const salvo = await AsyncStorage.getItem(CHAVE);
      if (salvo) setEstado(JSON.parse(salvo));
    } catch {
      // segue com o estado atual
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(recarregar);
  }, [recarregar]);

  const persistir = useCallback(async (novo: Estado) => {
    setEstado(novo);
    if (novo.modo === 'demo') {
      try {
        await AsyncStorage.setItem(CHAVE, JSON.stringify(novo));
      } catch {
        // armazenamento indisponível: mantém em memória
      }
    }
  }, []);

  const valor = useMemo<Estado & Acoes>(() => {
    const pessoa = (id: string) => estado.pessoas.find((p) => p.id === id);
    return {
      ...estado,
      carregando,
      eu: pessoa(estado.euId),
      pessoa,
      recarregar,
      async salvarPerfil(p, consentiu) {
        if (estado.modo === 'nuvem') {
          await nuvem.salvarPerfil({ ...p, nascimento: p.nascimento ?? null }, consentiu);
          return recarregar();
        }
        await persistir({ ...estado, pessoas: estado.pessoas.map((x) => (x.id === estado.euId ? { ...x, ...p } : x)) });
      },
      async adicionarResultados(rs) {
        if (estado.modo === 'nuvem') return recarregar();
        const atuais = estado.resultados[estado.euId] ?? [];
        await persistir({ ...estado, resultados: { ...estado.resultados, [estado.euId]: [...atuais, ...rs] } });
      },
      async definirNivel(pessoaId, nivel) {
        const alvo = pessoa(pessoaId);
        if (estado.modo === 'nuvem' && alvo?.conexaoId) {
          await nuvem.definirNivel(alvo.conexaoId, nivel);
          return recarregar();
        }
        await persistir({ ...estado, pessoas: estado.pessoas.map((x) => (x.id === pessoaId ? { ...x, nivelEnviado: nivel } : x)) });
      },
      async criarConvite() {
        if (estado.modo === 'nuvem') return nuvem.criarConvite();
        return Math.random().toString(36).slice(2, 10).toUpperCase();
      },
      async aceitarConvite(codigo) {
        if (estado.modo === 'nuvem') {
          await nuvem.aceitarConvite(codigo);
          return recarregar();
        }
        // Demonstração: qualquer código adiciona uma pessoa fictícia
        const id = 'conv-' + codigo.toLowerCase();
        if (pessoa(id)) return;
        const nova: Pessoa = {
          id, nome: 'Convidado ' + codigo.slice(0, 3).toUpperCase(), sexo: 'F', nascimento: 1994,
          cabelo: '#1f1a17', cor: '#9333ea', nivelRecebido: 'resumo', nivelEnviado: 'resumo',
        };
        await persistir({ ...estado, pessoas: [...estado.pessoas, nova] });
      },
      async removerConexao(pessoaId) {
        const alvo = pessoa(pessoaId);
        if (estado.modo === 'nuvem' && alvo?.conexaoId) {
          await nuvem.removerConexao(alvo.conexaoId);
          return recarregar();
        }
        const { [pessoaId]: _, ...resto } = estado.resultados;
        await persistir({ ...estado, pessoas: estado.pessoas.filter((x) => x.id !== pessoaId), resultados: resto });
      },
      async apagarTudo() {
        if (estado.modo === 'nuvem') {
          await nuvem.apagarMeusDados();
          setEstado(inicialDemo());
          return;
        }
        await persistir({ ...estado, pessoas: estado.pessoas.filter((x) => x.id === estado.euId), resultados: {} });
      },
      async restaurarDemo() {
        await persistir(inicialDemo());
      },
    };
  }, [estado, carregando, persistir, recarregar]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAmpla() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAmpla fora do AmplaProvider');
  return v;
}
