import React, { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { usePalette } from '@/constants/theme';
import { SISTEMAS, SistemaId } from '@/data/catalogo';
import type { Sexo } from '@/lib/saude';

const AG = Animated.createAnimatedComponent(G);

type Props = {
  sexo: Sexo;
  cabelo?: string;
  /** cor da pessoa: tinge levemente o corpo */
  cor?: string;
  /** sistemas que a pessoa tem; os outros órgãos não aparecem */
  sistemas?: SistemaId[];
  ativo?: SistemaId | null;
  alertas?: SistemaId[];
  onToque?: (s: SistemaId) => void;
  /** só a silhueta, sem órgãos nem cabelo */
  vazio?: boolean;
  largura?: number;
};

function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v * t + y[i] * (1 - t)).toString(16).padStart(2, '0')).join('');
}

export function Corpo({ sexo, cabelo = '#3b2a20', cor, sistemas, ativo = null, alertas = [], onToque, vazio, largura = 220 }: Props) {
  const c = usePalette();
  const body = cor && !vazio ? mix(cor, c.body, 0.18) : c.body;
  const edge = cor && !vazio ? mix(cor, c.bodyEdge, 0.45) : c.bodyEdge;
  const [pulso] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!ativo) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 0.55, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulso, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ativo, pulso]);

  const tem = (s: SistemaId) => !vazio && (!sistemas || sistemas.includes(s));
  const fillOf = (s: SistemaId) => {
    const base = SISTEMAS[s].cor;
    if (ativo === s) return base;
    return mix(base, c.body, ativo ? 0.18 : 0.45);
  };
  const op = (s: SistemaId) => (ativo && ativo !== s ? 0.35 : 1);

  const org = (s: SistemaId, children: React.ReactNode) =>
    tem(s) ? (
      ativo === s ? (
        <AG opacity={pulso} onPress={onToque ? () => onToque(s) : undefined}>{children}</AG>
      ) : (
        <G opacity={op(s)} onPress={onToque ? () => onToque(s) : undefined}>{children}</G>
      )
    ) : null;

  const limb = { stroke: body, strokeLinecap: 'round' as const };
  const F = sexo === 'F';
  const altura = (largura * 470) / 172;

  return (
    <Svg width={largura} height={altura} viewBox="34 6 172 470">
      {/* cabelo longo atrás (feminino) */}
      {F && !vazio && <Path fill={cabelo} d="M88,46 Q86,11 120,12 Q154,11 152,46 L157,100 Q150,107 141,100 L139,72 L101,72 L99,100 Q90,107 83,100 Z" />}
      {/* membros */}
      {F ? (
        <>
          <Line x1={68} y1={114} x2={50} y2={192} strokeWidth={17} {...limb} />
          <Line x1={50} y1={192} x2={42} y2={258} strokeWidth={14} {...limb} />
          <Line x1={172} y1={114} x2={190} y2={192} strokeWidth={17} {...limb} />
          <Line x1={190} y1={192} x2={198} y2={258} strokeWidth={14} {...limb} />
          <Line x1={101} y1={286} x2={98} y2={380} strokeWidth={31} {...limb} />
          <Line x1={98} y1={380} x2={97} y2={462} strokeWidth={22} {...limb} />
          <Line x1={139} y1={286} x2={142} y2={380} strokeWidth={31} {...limb} />
          <Line x1={142} y1={380} x2={143} y2={462} strokeWidth={22} {...limb} />
          <Rect x={111} y={72} width={18} height={24} rx={6} fill={body} />
          <Path fill={body} stroke={edge} strokeWidth={1.2} d="M78,102 Q120,92 162,102 L172,114 Q178,145 170,172 Q160,200 160,228 Q168,252 172,272 L168,296 L72,296 L68,272 Q72,252 80,228 Q80,200 70,172 Q62,145 68,114 Z" />
          <Circle cx={120} cy={47} r={27} fill={body} stroke={edge} strokeWidth={1.2} />
          {!vazio && <Path fill={cabelo} d="M94,40 Q96,17 120,17 Q144,17 146,40 Q138,28 124,30 Q110,26 94,40 Z" />}
        </>
      ) : (
        <>
          <Line x1={66} y1={112} x2={48} y2={192} strokeWidth={22} {...limb} />
          <Line x1={48} y1={192} x2={40} y2={262} strokeWidth={19} {...limb} />
          <Line x1={174} y1={112} x2={192} y2={192} strokeWidth={22} {...limb} />
          <Line x1={192} y1={192} x2={200} y2={262} strokeWidth={19} {...limb} />
          <Line x1={99} y1={284} x2={95} y2={380} strokeWidth={32} {...limb} />
          <Line x1={95} y1={380} x2={93} y2={462} strokeWidth={26} {...limb} />
          <Line x1={141} y1={284} x2={145} y2={380} strokeWidth={32} {...limb} />
          <Line x1={145} y1={380} x2={147} y2={462} strokeWidth={26} {...limb} />
          <Rect x={108} y={72} width={24} height={24} rx={6} fill={body} />
          <Path fill={body} stroke={edge} strokeWidth={1.2} d="M76,100 Q120,88 164,100 L178,112 Q186,180 170,248 L166,292 L74,292 L70,248 Q54,180 62,112 Z" />
          <Circle cx={120} cy={46} r={29} fill={body} stroke={edge} strokeWidth={1.2} />
          {!vazio && <Path fill={cabelo} d="M91,42 Q88,13 120,14 Q152,13 149,42 Q147,29 136,26 Q120,21 104,26 Q93,29 91,42 Z" />}
        </>
      )}

      {/* vasos (sangue) */}
      {org('sangue', <>
        <Path
          fill="none"
          stroke={fillOf('sangue')}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeDasharray={ativo === 'sangue' ? '6 5' : undefined}
          d="M124,160 L122,272 M122,272 L100,292 L96,380 L94,452 M122,272 L140,292 L144,380 L146,452 M120,108 L68,116 L50,192 L42,256 M120,108 L172,116 L190,192 L198,256 M120,108 L120,78"
        />
      </>)}
      {/* ossos */}
      {org('ossos', <>
        <Path fill="none" stroke={fillOf('ossos')} strokeWidth={7} strokeLinecap="round" d="M99,300 L96,372 M141,300 L144,372 M97,392 L95,448 M143,392 L145,448 M64,122 L51,184 M176,122 L189,184" />
      </>)}
      {/* coração */}
      {org('cardio', <>
        <Path fill={fillOf('cardio')} d="M132,142 c-5,-11 -23,-8 -21,6 c2,11 14,17 21,26 c7,-9 19,-15 21,-26 c2,-14 -16,-17 -21,-6 Z" />
      </>)}
      {/* fígado */}
      {org('figado', <>
        <Path fill={fillOf('figado')} d="M76,186 Q100,172 140,180 Q152,186 138,197 Q112,213 86,215 Q72,207 76,186 Z" />
      </>)}
      {/* baço (ferro) */}
      {org('ferro', <>
        <Ellipse cx={160} cy={196} rx={9} ry={15} rotation={-18} origin="160,196" fill={fillOf('ferro')} />
      </>)}
      {/* pâncreas */}
      {org('glicose', <>
        <Path fill={fillOf('glicose')} d="M108,218 Q132,207 158,214 Q162,221 150,224 Q128,227 110,226 Q104,222 108,218 Z" />
      </>)}
      {/* rins */}
      {org('rins', <>
        <Path fill={fillOf('rins')} d="M99,236 c-9,0 -13,8 -13,17 c0,10 5,17 13,17 c6,0 7,-5 4,-9 c-3,-4 -3,-11 0,-15 c3,-5 2,-10 -4,-10 Z" />
        <Path fill={fillOf('rins')} d="M141,236 c9,0 13,8 13,17 c0,10 -5,17 -13,17 c-6,0 -7,-5 -4,-9 c3,-4 3,-11 0,-15 c-3,-5 -2,-10 4,-10 Z" />
      </>)}
      {/* tireoide */}
      {org('hormonios', <>
        <Path fill={fillOf('hormonios')} d="M120,86 c-3,-6 -12,-8 -14,-1 c-2,6 3,11 9,10 c2,0 4,-2 5,-4 c1,2 3,4 5,4 c6,1 11,-4 9,-10 c-2,-7 -11,-5 -14,1 Z" />
      </>)}
      {/* linfonodos (imunidade) */}
      {org('imunidade', <>
        {[[98, 74], [142, 74], [76, 122], [164, 122], [96, 282], [144, 282]].map(([x, y]) => (
          <Circle key={`${x}-${y}`} cx={x} cy={y} r={4.5} fill={fillOf('imunidade')} />
        ))}
      </>)}

      {/* anéis de alerta */}
      {!vazio &&
        alertas.filter((s) => s !== ativo && tem(s)).map((s) => {
          const pos: Partial<Record<SistemaId, [number, number]>> = {
            cardio: [132, 152], figado: [108, 196], ferro: [160, 196], glicose: [134, 219], rins: [120, 253],
            hormonios: [120, 86], ossos: [96, 340], sangue: [122, 230], imunidade: [164, 122],
          };
          const p = pos[s];
          return p ? <Circle key={s} cx={p[0]} cy={p[1]} r={15} fill="none" stroke={c.bad} strokeWidth={1.4} strokeDasharray="3 3" /> : null;
        })}
    </Svg>
  );
}
