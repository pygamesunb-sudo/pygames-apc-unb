/**
 * Tenta fazer o parse de uma string JSON que pode estar incompleta (cortada no meio devido a um stream).
 * Usa heuristicas simples para fechar arrays e objetos abertos.
 * Retorna um objeto JSON parcial ou um objeto vazio.
 */
export function parsePartialJson(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') return {};

  let s = jsonString.trim();
  
  // Se contiver '{', remove tudo que vem antes do primeiro '{'
  // (trata marcações markdown ```json ou introduções textuais da LLM)
  const firstBrace = s.indexOf('{');
  if (firstBrace !== -1) {
    s = s.substring(firstBrace);
  }
  
  // Tenta parsear direto
  try {
    // Tira os marcadores finais se houver
    let clean = s;
    if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3).trim();
    
    // Tenta encontrar o último '}' e ver se conseguimos parsear a string cortada até ele
    // (trata conclusões textuais ou marcadores markdown no final da resposta)
    const lastBrace = clean.lastIndexOf('}');
    if (lastBrace !== -1) {
      try {
        return JSON.parse(clean.substring(0, lastBrace + 1));
      } catch (e) {}
    }
    
    return JSON.parse(clean);
  } catch (e) {
    // Falhou, esta incompleto.
  }

  // Abordagem heurística simples: ir adicionando fechamentos possíveis
  // e testando se o JSON.parse passa.
  // Vamos tentar fechar strings abertas, arrays e objetos.
  
  // Adiciona possiveis fechamentos
  const endingsToTry = [
    '"}',
    '}',
    ']}',
    '"]}',
    '"]} }',
    '""}',
    '"""}'
  ];

  for (let end of endingsToTry) {
    try {
      return JSON.parse(s + end);
    } catch (e) {}
  }
  
  // Se nada funcionou (geralmente nos primeiros pedaços de texto), 
  // extraímos o titulo e descricao via Regex como fallback visual
  const fallback = {};
  
  const titleMatch = s.match(/"title"\s*:\s*"([^"]*)/);
  if (titleMatch) fallback.title = titleMatch[1];
  
  const descMatch = s.match(/"description"\s*:\s*"([^"]*)/);
  if (descMatch) fallback.description = descMatch[1];
  
  // Para test_cases, pegamos os que ja estiverem formados
  const testCasesMatch = s.match(/"test_cases"\s*:\s*\[(.*)/s);
  if (testCasesMatch) {
    fallback.test_cases = [];
    const tcStr = testCasesMatch[1];
    // Pega cada objeto inteiro de caso de teste { ... }
    const regexTC = /\{[^\}]+\}/g;
    let match;
    while ((match = regexTC.exec(tcStr)) !== null) {
      try {
        fallback.test_cases.push(JSON.parse(match[0]));
      } catch(e) {}
    }
  }

  return fallback;
}
