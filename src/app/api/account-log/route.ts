import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { IncomingForm, Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage } from 'http';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

function parseFormAsync(
  req: IncomingMessage
): Promise<{ fields: Record<string, string[] | undefined>; files: Files }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true, multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export async function POST(req: Request) {
  try {
    const { files } = await parseFormAsync(req as unknown as IncomingMessage);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return withCorsHeaders(
        NextResponse.json({ success: false, error: 'Arquivo CSV ausente' }, { status: 400 })
      );
    }

    const filePath = uploadedFile.filepath;
    const fileName = path.basename(uploadedFile.originalFilename || filePath);

    if (!fileName.endsWith('.csv')) {
      return withCorsHeaders(
        NextResponse.json({ success: false, error: 'Tipo de arquivo inválido. Envie um .csv' }, { status: 400 })
      );
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const match = fileName.match(/\d+/);

    if (!match) {
      return withCorsHeaders(
        NextResponse.json({ success: false, error: 'ID da conta não encontrado no nome do arquivo' }, { status: 400 })
      );
    }

    const accountId = match[0];
    const objectPath = `logs/${accountId}/${fileName}`;

    const { error } = await supabase.storage
      .from('logs')
      .upload(objectPath, fileBuffer, {
        contentType: 'text/csv',
        upsert: true,
      });

    if (error) {
      console.error('Erro ao enviar CSV:', error.message);
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
