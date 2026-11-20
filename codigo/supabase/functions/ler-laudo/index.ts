// Supabase Edge Function: ler-laudo
// Lê o PDF/foto de um laudo com a API do Claude e grava os parâmetros
// em `results` com o exame em status "conferir" (o usuário confirma no app).
//
// Variáveis de ambiente (supabase secrets set ...):
//   ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (as duas últimas já existem)
//   ANTHROPIC_MODEL (opcional, padrão abaixo)

import { createClient } from "jsr:@supabase/supabase-js@2";

const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5-5";

// Códigos canônicos e o sistema (órgão) de cada um — iguais aos do app (src/data/catalogo.ts)
const CATALOGO = `
sangue: eritrocitos, hemoglobina, hematocrito, vcm, hcm, chcm, rdw, leucocitos, neutrofilos, linfocitos, monocitos, eosinofilos, basofilos, plaquetas, vpm, vitamina_b12
cardio: colesterol_total, ldl, hdl, nao_hdl, vldl, triglicerides, pcr_us, apob, lpa
figado: tgo, tgp, ggt, fosfatase_alcalina, bilirrubina_total, bilirrubina_direta, bilirrubina_indireta, proteinas_totais, albumina, globulinas, relacao_ag
rins: creatinina, tfg, ureia, acido_urico
glicose: glicose, hba1c
ferro: ferritina, ferro, saturacao_transferrina, transferrina
hormonios: tsh, t4_livre, anti_tpo, anti_tg, testosterona_total, testosterona_livre, shbg
ossos: sodio, potassio, calcio, magnesio, vitamina_d
imunidade: hiv, sifilis_vdrl, hbsag, anti_hbs, anti_hcv, htlv, toxo_igg, toxo_igm, cmv_igg, cmv_igm
`;

const PROMPT = `Você recebe um laudo de exames laboratoriais brasileiro.
Extraia TODOS os parâmetros com resultado. Responda APENAS com JSON válido, sem texto antes ou depois, no formato:
{"coletado_em":"AAAA-MM-DD ou null","laboratorio":"nome ou null","resultados":[
 {"codigo":"código canônico ou slug","sistema":"sangue|cardio|figado|rins|glicose|ferro|hormonios|ossos|imunidade|outros",
  "nome":"nome como no laudo","valor":número ou null,"valor_texto":"texto se qualitativo, senão null",
  "unidade":"unidade ou null","ref_min":número ou null,"ref_max":número ou null}]}
Regras:
- Use o código canônico da lista quando o parâmetro existir nela; senão crie um slug em minúsculas sem acento.
- Para a faixa de referência use a de ADULTO do sexo do paciente indicada no laudo. Para "inferior a X" use ref_max = X. Para metas de colesterol use a meta de risco baixo.
- Números com ponto decimal (ex.: 1,05 → 1.05; 5.580 leucócitos → 5580).
- Não invente valores. Ignore textos explicativos e valores de outras datas ("resultado anterior").
Códigos canônicos por sistema:
${CATALOGO}`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
};

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(bin);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  const body = await req.json().catch(() => ({}));
  const exam_id: string | undefined = body?.exam_id;
  try {
    if (!exam_id) return json({ error: "exam_id obrigatório" }, 400);

    // Cliente do usuário (respeita RLS) para validar a posse do exame
    const auth = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const user = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: exam, error: e1 } = await user.from("exams").select("*").eq("id", exam_id).single();
    if (e1 || !exam) return json({ error: "exame não encontrado" }, 404);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("exams").update({ status: "lendo", erro: null }).eq("id", exam_id);

    const { data: file, error: e2 } = await admin.storage.from("laudos").download(exam.arquivo_path);
    if (e2 || !file) throw new Error("arquivo não encontrado");
    const mediaType = file.type || (exam.arquivo_path.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
    const data = toBase64(await file.arrayBuffer());
    const source = { type: "base64", media_type: mediaType, data };
    const block = mediaType === "application/pdf" ? { type: "document", source } : { type: "image", source };

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        messages: [{ role: "user", content: [block, { type: "text", text: PROMPT }] }],
      }),
    });
    if (!resp.ok) throw new Error(`API do Claude: ${resp.status} ${await resp.text()}`);
    const out = await resp.json();
    const text: string = out.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

    const rows = (parsed.resultados ?? []).map((r: Record<string, unknown>) => ({
      exam_id,
      owner: exam.owner,
      codigo: String(r.codigo ?? "").slice(0, 60) || "desconhecido",
      nome: String(r.nome ?? r.codigo ?? "").slice(0, 120),
      valor: typeof r.valor === "number" ? r.valor : null,
      valor_texto: r.valor_texto ?? null,
      unidade: r.unidade ?? null,
      ref_min: typeof r.ref_min === "number" ? r.ref_min : null,
      ref_max: typeof r.ref_max === "number" ? r.ref_max : null,
      sistema: r.sistema ?? "outros",
    }));

    await admin.from("results").delete().eq("exam_id", exam_id);
    if (rows.length) {
      const { error: e3 } = await admin.from("results").insert(rows);
      if (e3) throw e3;
    }
    await admin.from("exams").update({
      status: "conferir",
      coletado_em: parsed.coletado_em ?? exam.coletado_em,
      laboratorio: parsed.laboratorio ?? exam.laboratorio,
    }).eq("id", exam_id);

    return json({ ok: true, total: rows.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    try {
      if (exam_id) {
        const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await admin.from("exams").update({ status: "erro", erro: msg.slice(0, 500) }).eq("id", exam_id);
      }
    } catch { /* ignore */ }
    return json({ error: msg }, 500);
  }
});
