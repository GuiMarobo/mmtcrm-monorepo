import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateNegotiationDto } from './update-negotiation.dto';

async function errorsFor(body: object) {
  const dto = plainToInstance(UpdateNegotiationDto, body);
  return validate(dto, { whitelist: true });
}

describe('UpdateNegotiationDto', () => {
  it('recusa totalValue: o valor só muda pelos itens (ADR 0015)', async () => {
    const errors = await errorsFor({ totalValue: 2000 });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('totalValue');
    expect(Object.values(errors[0].constraints ?? {})[0]).toMatch(/itens/);
  });

  it('recusa totalValue mesmo acompanhado de campo válido', async () => {
    const errors = await errorsFor({ notes: 'ok', totalValue: 0 });

    expect(errors.map((e) => e.property)).toEqual(['totalValue']);
  });

  it('aceita clientId e notes', async () => {
    const errors = await errorsFor({
      clientId: '7f1d7c1e-8a2b-4c3d-9e4f-5a6b7c8d9e0f',
      notes: 'Cliente prefere retirar na loja',
    });

    expect(errors).toHaveLength(0);
  });
});
