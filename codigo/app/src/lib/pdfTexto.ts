// Nativo (Android/iPhone): leitura de PDF ainda não disponível sem servidor.
export async function textoDoPdf(_uri: string, _arquivo?: Blob | null): Promise<string> {
  throw new Error('Por enquanto a leitura automática funciona na versão web da Ampla. No app, use a versão web para enviar o PDF.');
}
