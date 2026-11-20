# Ampla — documento do produto

> Seus exames, sua evolução.

## 1. Visão

A Ampla é um aplicativo (Android e iPhone) em que cada pessoa guarda seus exames laboratoriais,
vê a própria saúde num **personagem com órgãos** e acompanha a evolução ao longo do tempo.
Quem quiser se conecta com família e amigos para **comparar lado a lado**, sempre escolhendo o que mostra.

A Ampla **organiza e compara**. Não dá diagnóstico nem recomenda tratamento — as explicações
são educativas e sempre direcionam para o médico.

## 2. Princípios

1. **Cada um é dono dos seus dados.** Nada é visível para outra pessoa sem autorização explícita.
2. **Comparação implícita.** Não existe "placar" ou "disputa" escrita na interface. A motivação vem
   de ver a própria evolução e a dos outros lado a lado.
3. **Evolução, não número absoluto.** Destaque visual para quem melhorou em relação a si mesmo.
4. **Simples no celular.** Toque no órgão → vê os exames daquele sistema.
5. **Saúde sem alarme.** Linguagem calma, sem diagnóstico; o médico decide.

## 3. Fases

### Fase 1 — Uso individual (MVP)
- Cadastro (telefone ou e-mail) e criação do **personagem**: nome, sexo, ano de nascimento, cor do cabelo.
- **Enviar exames**: PDF ou foto do laudo.
- **Leitura automática do laudo, gratuita**: o app extrai o texto do PDF no próprio aparelho e reconhece
  os parâmetros (nome, valor, unidade, faixa de referência, data da coleta). O usuário **confere, corrige
  e confirma** antes de salvar. (Leitura por IA de fotos fica como opção futura.)
- **Painel**: personagem com órgãos; cada sistema acende na sua cor; lista de exames com barra de
  referência, histórico e mini-tendência.
- **Exames a fazer**: check-up inicial (por sexo e idade) e lista pessoal; gera **PDF para entregar
  no laboratório**.

### Fase 2 — Conexões
- **Convidar** por link (WhatsApp, SMS, qualquer app).
- Conexão só existe quando **os dois aceitam**.
- **Nível de compartilhamento por conexão**: `nada` · `resumo` (contagens e evolução) · `tudo` (valores).
- **Comparar**: escolher duas pessoas; personagens frente a frente; exames em comum lado a lado,
  cada um com a própria faixa de referência.

### Fase 3 — Descoberta e evolução
- "**Amigos que já usam a Ampla**" pela agenda (com permissão; números comparados por hash, nunca enviados em texto).
- Linha do tempo de evolução e marcos ("LDL caiu 20% desde a última coleta").
- Lembretes de check-up.

## 4. Telas

| Tela | Conteúdo |
|---|---|
| Início | Logo, minha pessoa em destaque, conexões, botões Enviar exames · Comparar · Exames a fazer |
| Pessoa | Personagem com órgãos (toque = sistema), chips de sistemas, painel do sistema, resumo, levantamento (recolhível) |
| Enviar exames | Escolher arquivo → leitura → conferência → salvar |
| Exames a fazer | Check-up inicial (padrão) e listas pessoais; marcar itens; gerar PDF |
| Comparar | Começa vazio (silhuetas); escolher duas pessoas; órgãos aparecem; exames em comum |
| Conexões | Convidar, pedidos recebidos, nível de compartilhamento de cada conexão |
| Perfil | Personagem, dados, privacidade, exportar e **apagar tudo** |

## 5. Dados (Supabase / Postgres)

- `profiles` — id (= usuário), nome, sexo, ano de nascimento, cor do cabelo, cor de destaque.
- `exams` — uma coleta: dono, data da coleta, laboratório, arquivo (Storage), status da leitura.
- `results` — um parâmetro: exame, código (ex.: `ldl`), valor, unidade, referência mín./máx., sistema.
- `connections` — pedido/aceite entre duas pessoas + nível que cada lado compartilha.
- `invites` — código de convite com validade.

Regras (Row Level Security):
- Cada pessoa lê e escreve só os próprios `exams` e `results`.
- Uma conexão aceita com nível `tudo` permite ler os `results` do outro; `resumo` libera só a visão agregada.
- Arquivos dos laudos ficam em bucket privado, pasta por usuário; só o dono acessa.

## 6. Privacidade e legal (antes do lançamento público)

- **LGPD — dados sensíveis de saúde**: consentimento específico e destacado no cadastro; política de privacidade;
  exportar e apagar todos os dados a qualquer momento; registro de consentimentos.
- **Anvisa**: manter a Ampla como organizadora/comparadora (sem diagnóstico ou conduta) para não se
  enquadrar como software médico. Revisar com advogado da área da saúde.
- Lojas: explicar o uso da agenda (fase 3) e de arquivos.
- Hospedagem preferencial no Brasil (Supabase região São Paulo).

## 7. Custos

- **Zero na fase atual**: Supabase gratuito, leitura de PDF no aparelho, app web instalável
  ("Adicionar à tela de início") hospedado de graça (ex.: GitHub Pages).
- Só se um dia quiser as lojas: Google Play ~US$ 25 (uma vez), Apple US$ 99/ano.
- Projetos gratuitos do Supabase pausam após 7 dias sem uso; basta reativar no painel.

## 8. Próximos passos

1. Criar projeto no Supabase e rodar `supabase/schema.sql`.
2. Configurar a função `ler-laudo` com a chave da API do Claude.
3. Preencher `.env` do app e testar no celular com Expo Go / development build.
4. Fase 2 (conexões) e testes com família.
5. Revisão jurídica → publicação nas lojas.
