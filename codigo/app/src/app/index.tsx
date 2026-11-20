import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PessoaCard } from '@/components/PessoaCard';
import { Logo, T, Tela } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { nuvemConfigurada } from '@/lib/nuvem';
import { useAmpla } from '@/lib/store';

function Acao({ icone, titulo, sub, onPress, destaque }: { icone: string; titulo: string; sub: string; onPress: () => void; destaque?: boolean }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1, minWidth: 150, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14,
        backgroundColor: c.surface, borderWidth: 1, borderColor: destaque ? c.muted : c.line, opacity: pressed ? 0.8 : 1,
      })}>
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
        <T style={{ color: c.bg, fontSize: 20, fontWeight: '700' }}>{icone}</T>
      </View>
      <View style={{ flex: 1 }}>
        <T v="h3">{titulo}</T>
        <T v="small" cor="muted">{sub}</T>
      </View>
    </Pressable>
  );
}

export default function Inicio() {
  const c = usePalette();
  const ins = useSafeAreaInsets();
  const { eu, pessoas, resultados, euId, modo } = useAmpla();
  const outros = pessoas.filter((p) => p.id !== euId);

  return (
    <View style={{ flex: 1, paddingTop: ins.top, backgroundColor: c.bg }}>
      <Tela>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 12 }}>
          <View style={{ gap: 10, flex: 1 }}>
            <Logo tamanho={48} />
            <T v="h1" style={{ fontSize: 36 }}>Ampla</T>
            <T cor="muted">Seus exames, sua evolução.</T>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/perfil')} style={{ padding: 8 }}>
            <T v="small" style={{ fontWeight: '600' }}>Perfil ›</T>
          </Pressable>
        </View>

        {modo === 'demo' && (
          <Pressable onPress={() => nuvemConfigurada && router.push('/entrar')} style={{ backgroundColor: c.warnBg, borderRadius: 10, padding: 10 }}>
            <T v="small" cor="warn">
              Modo demonstração · pessoas e exames fictícios{nuvemConfigurada ? ' · toque para entrar ou criar sua conta' : ''}
            </T>
          </Pressable>
        )}

        {eu ? (
          <PessoaCard p={eu} resultados={resultados[eu.id] ?? []} eu />
        ) : modo === 'nuvem' ? (
          <Pressable onPress={() => router.push('/perfil')} style={{ padding: 16, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, gap: 4 }}>
            <T v="h2">Crie seu personagem</T>
            <T v="small" cor="muted">Nome, sexo e aparência. Leva um minuto.</T>
          </Pressable>
        ) : null}

        <T v="label" cor="muted">Conexões</T>
        {outros.map((p) => (
          <PessoaCard key={p.id} p={p} resultados={p.nivelRecebido === 'nada' ? [] : resultados[p.id] ?? []} />
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/conexoes')}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: c.muted, opacity: pressed ? 0.8 : 1 })}>
          <View style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderStyle: 'dashed', borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
            <T style={{ fontSize: 28 }} cor="muted">+</T>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="h3">Convidar pessoa</T>
            <T v="small" cor="muted">Envie um convite pelo WhatsApp e escolha o que cada um vê.</T>
          </View>
        </Pressable>

        <View style={{ gap: 12 }}>
          <Acao destaque icone="↑" titulo="Enviar exames" sub="PDF ou foto do laudo" onPress={() => router.push('/enviar')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Acao icone="⇄" titulo="Comparar" sub="Duas pessoas lado a lado" onPress={() => router.push('/comparar')} />
            <Acao icone="✓" titulo="Exames a fazer" sub="Lista e PDF para o laboratório" onPress={() => router.push('/exames-a-fazer')} />
          </View>
        </View>

        <T v="small" cor="muted">A Ampla organiza e compara resultados de laboratório. Não substitui a avaliação médica.</T>
      </Tela>
    </View>
  );
}
