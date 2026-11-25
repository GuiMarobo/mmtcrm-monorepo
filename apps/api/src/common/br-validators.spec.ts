import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateClientDto } from '../clients/dto/create-client.dto';
import { isBrazilianPhone, isCnpj, isCpf, isPersonName } from './br-validators';

describe('isBrazilianPhone', () => {
  it.each(['11987654321', '(11) 98765-4321', '1132654321', '(21) 3265-4321'])(
    'aceita %s',
    (phone) => expect(isBrazilianPhone(phone)).toBe(true),
  );

  it.each([
    ['curto demais', '119876543'],
    ['longo demais', '119876543210'],
    ['DDD inexistente', '0198765432'],
    ['celular sem o 9', '11887654321'],
    ['dígitos repetidos', '11111111111'],
    ['letras', 'abcdefghijk'],
    ['vazio', ''],
  ])('recusa %s', (_, phone) => expect(isBrazilianPhone(phone)).toBe(false));

  it('recusa o que não é texto', () => {
    expect(isBrazilianPhone(11987654321)).toBe(false);
  });
});

describe('isCpf', () => {
  it.each(['52998224725', '529.982.247-25'])('aceita %s', (cpf) =>
    expect(isCpf(cpf)).toBe(true),
  );

  it.each([
    ['dígito verificador errado', '52998224724'],
    ['todos iguais', '11111111111'],
    ['curto', '5299822472'],
    ['letras', 'abc.def.ghi-jk'],
  ])('recusa %s', (_, cpf) => expect(isCpf(cpf)).toBe(false));
});

describe('isCnpj', () => {
  it.each(['11222333000181', '11.222.333/0001-81'])('aceita %s', (cnpj) =>
    expect(isCnpj(cnpj)).toBe(true),
  );

  it.each([
    ['dígito verificador errado', '11222333000182'],
    ['todos iguais', '00000000000000'],
    ['curto', '1122233300018'],
  ])('recusa %s', (_, cnpj) => expect(isCnpj(cnpj)).toBe(false));
});

describe('isPersonName', () => {
  it.each([
    'Maria',
    'João da Silva',
    "Ana D'Ávila",
    'Ana-Clara',
    'Titular removido',
  ])('aceita %s', (name) => expect(isPersonName(name)).toBe(true));

  it.each([
    'Maria 2',
    '12345',
    'Maria/José',
    'Maria!',
    'maria@x',
    'Ana.',
    '-Ana',
    '',
    '   ',
  ])('recusa %p', (name) => expect(isPersonName(name)).toBe(false));
});

describe('CPF no DTO de cliente', () => {
  const build = (cpf: string) =>
    plainToInstance(CreateClientDto, {
      name: 'Maria Souza',
      phone: '11987654321',
      origin: 'WHATSAPP',
      status: 'LEAD',
      qualification: 'QUALIFICADO',
      cpf,
    });

  it('grava só os dígitos, com ou sem máscara: os dois caem no mesmo CPF', () => {
    expect(build('529.982.247-25').cpf).toBe('52998224725');
    expect(build('52998224725').cpf).toBe('52998224725');
  });

  it('recusa CPF com dígito verificador errado', () => {
    const errors = validateSync(build('529.982.247-24'));
    expect(errors.map((e) => e.property)).toEqual(['cpf']);
  });

  it('recusa nome com número ou símbolo', () => {
    const dto = build('52998224725');
    dto.name = 'Maria/2';
    expect(validateSync(dto).map((e) => e.property)).toEqual(['name']);
  });
});
