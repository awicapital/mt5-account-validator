import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função utilitária para CORS
function withCorsHeaders(response: Response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', '*');
  return response;
}

// Lida com preflight
export async function OPTIONS() {
  return withCorsHeaders(new Response(null, { status: 204 }));
}

// Rota principal POST
export async function POST(req: Request) {
  try {
    const { filename, content } = await req.json();

    if (!filename || !content) {
      return withCorsHeaders(
        NextResponse.json({ success: false, error: 'filename ou content ausente' }, { status: 400 })
      );
    }

    if (!filename.endsWith('.csv')) {
      return withCorsHeaders(
        NextResponse.json({ success: false, error: 'O arquivo precisa ser .csv' }, { status: 400 })
      );
    }

    const match = filename.match(/\d+/);
    if (!match) {
      return withCorsHeaders(
        NextResponse.json({ success: false, error: 'Número da conta não encontrado no nome do arquivo' }, { status: 400 })
      );
    }

    const accountId = match[0];
    const objectPath = `logs/${accountId}/${filename}`;

    const buffer = Buffer.from(content, 'utf-8');

    const { error } = await supabase.storage
      .from('logs')
      .upload(objectPath, buffer, {
        contentType: 'text/csv',
        upsert: true,
      });

    if (error) {
      console.error('Erro Supabase:', error.message);
      return withCorsHeaders(
        NextResponse.json({ success: false, error: error.message }, { status: 500 })
      );
    }

    return withCorsHeaders(
      NextResponse.json({ success: true, path: objectPath })
    );
  } catch (err) {
    console.error('Erro interno API:', err);
    return withCorsHeaders(
      NextResponse.json({ success: false, error: 'Erro interno no servidor' }, { status: 500 })
    );
  }
}
