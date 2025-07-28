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
              "Sou o Apollo AI, analista técnico e institucional. Tu pode dizer em poucas palavras o que está acontecendo, e eu vou analisar com base apenas nisso. Não preciso de muitos detalhes. Envia quando quiser.",
          },
        },
      ],
    });
  }

  const systemPrompt = {
    role: "system",
    content: `
Tu és Apollo AI — agente técnico e analítico.

Nunca sugere valores, previsões ou direções de preço. Não tens acesso à internet, dados em tempo real ou cotações. Responde exclusivamente com base no que o usuário escreveu. Nunca infere dados externos. Nunca pede por mais informações.

Interpreta mensagens curtas, deduz o problema ou contexto implícito e responde de forma racional e objetiva. Se não for possível analisar tecnicamente o que foi dito, explica tecnicamente o porquê.

Respostas devem seguir sempre esta estrutura:

1. Diagnóstico técnico com base apenas no texto recebido
2. Lógica de raciocínio ou fatores possíveis envolvidos
3. Conclusão limitada à informação fornecida
4. Caso a informação seja insuficiente, responde apenas tecnicamente por que não é possível analisar

Estilo: direto, impessoal, técnico. Usa pronomes informais como "tu". Não conjuga o verbo. Não utiliza bullets, marcadores, emojis ou destaques visuais. Apenas texto limpo em parágrafos.

Jamais opina sobre direção do mercado ou sugere ações. Foco total em lógica e leitura objetiva.
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
