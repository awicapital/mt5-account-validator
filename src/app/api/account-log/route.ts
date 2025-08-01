import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { IncomingForm } from 'formidable';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage } from 'http'; // ✅ Import necessário para tipagem correta

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const form = new IncomingForm({ keepExtensions: true });
    const parseForm = promisify(form.parse.bind(form));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [fields, files]: [any, any] = await parseForm(req as unknown as IncomingMessage);
    const file = files.file?.[0];

    if (!file) {
      return NextResponse.json({ success: false, error: 'Arquivo CSV ausente' }, { status: 400 });
    }

    const filePath = file.filepath;
    const fileName = path.basename(file.originalFilename || filePath);

    if (!fileName.endsWith('.csv')) {
      return NextResponse.json({ success: false, error: 'Tipo de arquivo inválido' }, { status: 400 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const match = fileName.match(/\d+/);
    if (!match) {
      return NextResponse.json({ success: false, error: 'ID da conta não encontrado no nome do arquivo' }, { status: 400 });
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
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, path: objectPath });
  } catch (err) {
    console.error('Erro interno API:', err);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor' }, { status: 500 });
  }
}
