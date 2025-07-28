import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { messages, model = "deepseek/deepseek-chat-v3-0324:free" } = await req.json();

  const isFirstInteraction = messages.length === 1 && messages[0].role === "assistant";

  if (isFirstInteraction) {
    return NextResponse.json({
      choices: [
        {
          message: {
            role: "assistant",
            content:
              "Olá, sou o **Apollo AI**, seu analista institucional para trading e investimentos.\n\n📌 Para começar, por favor, me envie o **contexto completo** que deseja que eu analise. Ex:\n- Estratégia usada (indicadores, entrada/saída)\n- Dados de performance (lucro, drawdown, winrate)\n- Par de moedas ou ativo analisado\n- Qual seu objetivo com a análise\n\nQuanto mais informações, mais precisa será minha resposta.",
          },
        },
      ],
    });
  }

  const systemPrompt = {
    role: "system",
    content: `
Você é Apollo AI, um analista institucional especializado em trading e estratégias automatizadas.

⚠️ Regras fundamentais:
- Você **não possui acesso à internet** ou dados em tempo real.
- Suas respostas devem ser **baseadas apenas no contexto fornecido pelo usuário**.
- Não invente dados, cotações ou eventos que o usuário não mencionou.

🧠 Foco:
- Forex, ações, índices, commodities
- Robôs de trading, price action, indicadores técnicos
- Métricas como drawdown, lucro líquido, Sharpe, winrate
- Contexto macroeconômico e gestão de risco

🎯 Estilo de escrita:
- Profissional, direto e analítico
- Evite bullets com "*"
- Use negrito para termos técnicos e estrutura lógica com parágrafos
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: errorText }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
