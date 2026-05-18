import { ZodSchema } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export async function validarBody(req: NextRequest, schema: ZodSchema) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json({
          error: 'Dados inválidos',
          detalhes: result.error.errors.map(e => ({
            campo: e.path.join('.'),
            mensagem: e.message
          }))
        }, { status: 400 })
      };
    }
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
    };
  }
}
