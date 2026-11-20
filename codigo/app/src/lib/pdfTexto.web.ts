// Web: extrai o texto do PDF no próprio navegador com o PDF.js (gratuito, sem servidor).
const VERSAO = '3.11.174';
const BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${VERSAO}`;

type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<any> };
};

let carregando: Promise<PdfJs> | null = null;
function pdfjs(): Promise<PdfJs> {
  const w = window as unknown as { pdfjsLib?: PdfJs };
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib);
  carregando ??= new Promise((ok, erro) => {
    const s = document.createElement('script');
    s.src = `${BASE}/pdf.min.js`;
    s.onload = () => {
      const lib = (window as unknown as { pdfjsLib: PdfJs }).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = `${BASE}/pdf.worker.min.js`;
      ok(lib);
    };
    s.onerror = () => erro(new Error('Não foi possível carregar o leitor de PDF. Verifique a internet.'));
    document.head.appendChild(s);
  });
  return carregando;
}

/** Junta os pedaços de texto de cada página em linhas, preservando espaços largos. */
export async function textoDoPdf(uri: string, arquivo?: Blob | null): Promise<string> {
  const lib = await pdfjs();
  const dados = arquivo ? await arquivo.arrayBuffer() : await (await fetch(uri)).arrayBuffer();
  const doc = await lib.getDocument({ data: dados }).promise;
  const linhas: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const pag = await doc.getPage(p);
    const tc = await pag.getTextContent();
    const itens = (tc.items as { str: string; transform: number[]; width: number }[]).filter((i) => i.str.trim() !== '');
    const grupos: { y: number; itens: typeof itens }[] = [];
    for (const it of itens) {
      const y = it.transform[5];
      const g = grupos.find((x) => Math.abs(x.y - y) < 3);
      if (g) g.itens.push(it);
      else grupos.push({ y, itens: [it] });
    }
    grupos.sort((a, b) => b.y - a.y);
    for (const g of grupos) {
      g.itens.sort((a, b) => a.transform[4] - b.transform[4]);
      let linha = '';
      let fim = -1;
      for (const it of g.itens) {
        const x = it.transform[4];
        if (fim >= 0) linha += x - fim > 12 ? '    ' : x - fim > 1.5 ? ' ' : '';
        linha += it.str;
        fim = x + it.width;
      }
      linhas.push(linha);
    }
  }
  return linhas.join('\n');
}
