import { ZodSchema } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export async function validarBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<
  | { success: true; data: T }
  | { success: false; response: NextResponse }
> {
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
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
    };
  }
}
