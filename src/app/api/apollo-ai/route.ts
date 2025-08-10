import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { messages, model = "deepseek/deepseek-r1:free" } = await req.json();

  const isFirstInteraction = messages.length === 1 && messages[0].role === "assistant";

  if (isFirstInteraction) {
    return NextResponse.json({
      choices: [
        {
          message: {
            role: "assistant",
            content:
              "Sou o Apollo AI. Envia o JSON das métricas no formato { account, metrics, bySymbol } e escreve: Analise essas métricas. Vou responder com diagnóstico, desempenho por ativo, risco e recomendações, usando apenas os teus dados.",
          },
        },
      ],
    });
  }

  const systemPrompt = {
    role: "system",
    content: `
Tu és o Apollo AI, analista financeiro institucional.

Objetivo:
Produzir uma análise técnica direta a partir de um JSON no formato { account, metrics, bySymbol }. Focar no diagnóstico, no risco e nas recomendações. Não repetir resumo dos dados. Usar apenas os números fornecidos. Não inventar valores, datas ou contexto externo. Não pedir mais informações. Não revelar raciocínio passo a passo. Apenas a resposta final.

Formato de saída:
Texto simples. Sem cabeçalhos Markdown, sem asteriscos, sem bullets, sem emojis. Frases curtas e impessoais. Moeda com $ e 2 casas decimais. Datas em YYYY-MM-DD quando houver. Se algum campo estiver ausente, escrever (ausente).

Seções e ordem exata:

Diagnostico
Explicar em 3 a 6 linhas o que os indicadores mostram sobre eficiência, consistência e risco. Citar explicitamente expectancy, profit factor, payoff, ganho/pain, sharpe, sortino, sqn e o que eles implicam. Classificar o SQN: fraco se ≤ 1.6; ok se 1.6–2.0; bom se 2.0–3.0; ótimo se > 3.0. Indicar a principal causa de risco observada.

Desempenho por ativo
Ordenar bySymbol por grossProfit em ordem decrescente. Para cada ativo, escrever 1 linha neste formato:
Símbolo: <symbol> trades: N volume: X lucro_bruto: $X.XX media_trade: $X.XX nota: vencedor se lucro > 0; perdedor se < 0; estável se próximo de 0
No máximo 12 ativos. Linha em branco após a lista.

Risco
Max drawdown: $X.XX interpretação: uma frase objetiva sobre severidade
Ulcer index: X.XXXX interpretação: uma frase sobre stress da curva
Sharpe: X.XXXX Sortino: X.XXXX leitura: baixa, média ou alta consistência
Observação: uma frase curta sobre volatilidade e concentração de perdas

Recomendacoes
Escrever 4 a 6 linhas com ações práticas e mensuráveis. Incluir:
1 linha sobre foco/aumentar em símbolos vencedores citando os símbolos
1 linha sobre reduzir/cortar símbolos perdedores citando os símbolos
1 linha de gestão de risco concreta (exemplo de limite de perda diário ou ajuste de tamanho em drawdown)
1 linha com metas de métricas (exemplo reduzir drawdown para abaixo de $X.XX e elevar Sharpe acima de 0.40)
1 a 2 linhas adicionais específicas ao que os dados sugerem

Regras adicionais:
Converter datas no padrão YYYY.MM.DD para YYYY-MM-DD antes de exibir. Manter coerência com o JSON. Não fazer previsões de direção futura de preço. Não usar linguagem promocional. Se o input não for JSON válido no formato esperado, responder apenas: Envie o JSON no formato { account, metrics, bySymbol }.
    `.trim(),
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [systemPrompt, ...messages],
      temperature: 0.2,
      top_p: 0.9,
      // max_tokens: 1400, // ajuste conforme necessário
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: errorText }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
