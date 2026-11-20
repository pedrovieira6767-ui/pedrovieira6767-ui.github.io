import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Corpo } from '@/components/Corpo';
import { Pill, T } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { contagem, dataBR, idade, Pessoa, Resultado, series, ultimaColeta } from '@/lib/saude';

export function PessoaCard({ p, resultados, eu }: { p: Pessoa; resultados: Resultado[]; eu?: boolean }) {
  const c = usePalette();
  const ss = series(resultados);
  const ct = contagem(ss);
  const ult = ultimaColeta(resultados);
  const id = idade(p.nascimento);
  const visivel = p.nivelRecebido !== 'nada';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${p.nome}`}
      onPress={() => router.push({ pathname: '/pessoa/[id]', params: { id: p.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14,
        backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderLeftWidth: 4, borderLeftColor: p.cor,
        opacity: pressed ? 0.8 : 1,
      })}>
      <Corpo sexo={p.sexo} cabelo={p.cabelo} cor={p.cor} largura={58} sistemas={visivel ? undefined : []} />
      <View style={{ flex: 1, gap: 5 }}>
        <T v="h2" cor={p.cor}>{eu ? `${p.nome} (você)` : p.nome}</T>
        <T v="small" cor="muted">
          {[id ? `${id} anos` : null, ult && visivel ? `última coleta ${dataBR(ult)}` : null].filter(Boolean).join(' · ') || ' '}
        </T>
        {visivel ? (
          ss.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              <Pill status="fora" texto={`${ct.fora} fora`} />
              <Pill status="limite" texto={`${ct.limite} a observar`} />
            </View>
          ) : (
            <T v="small" cor="muted">Nenhum exame ainda</T>
          )
        ) : (
          <T v="small" cor="muted">Não compartilha exames</T>
        )}
        <T v="small" style={{ fontWeight: '600' }}>Ver exames ›</T>
      </View>
    </Pressable>
  );
}
