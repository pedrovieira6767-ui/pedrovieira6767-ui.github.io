import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { AmplaProvider } from '@/lib/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Layout() {
  const scheme = useColorScheme();
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <SafeAreaProvider>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AmplaProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: c.bg },
              headerTintColor: c.ink,
              headerShadowVisible: false,
              contentStyle: { backgroundColor: c.bg },
              headerBackTitle: 'Voltar',
            }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="pessoa/[id]" options={{ title: '' }} />
            <Stack.Screen name="enviar" options={{ title: 'Enviar exames' }} />
            <Stack.Screen name="exames-a-fazer" options={{ title: 'Exames a fazer' }} />
            <Stack.Screen name="comparar" options={{ title: 'Comparar' }} />
            <Stack.Screen name="conexoes" options={{ title: 'Conexões' }} />
            <Stack.Screen name="perfil" options={{ title: 'Meu personagem' }} />
            <Stack.Screen name="entrar" options={{ title: 'Entrar' }} />
          </Stack>
        </AmplaProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
