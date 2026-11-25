import { ValidateBy, buildMessage } from 'class-validator';
import type { ValidationOptions } from 'class-validator';

const digitsOf = (value: string) => value.replace(/\D/g, '');

// Conta só os dígitos: o formulário manda o telefone limpo, mas a importação
// CSV pode trazer "(11) 99999-9999" — os dois precisam passar.
export function isBrazilianPhone(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const digits = digitsOf(value);
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  // DDD vai de 11 a 99; celular (11 dígitos) sempre começa com 9.
  if (Number(digits.slice(0, 2)) < 11) return false;
  return digits.length === 10 || digits[2] === '9';
}

export function isCpf(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const cpf = digitsOf(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const checkDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10]);
}

export function isCnpj(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const cnpj = digitsOf(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  // Pesos 5..2 e depois 9..2 (12 dígitos); o segundo dígito começa em 6.
  const checkDigit = (length: number) => {
    let sum = 0;
    let weight = length - 7;
    for (let i = 0; i < length; i++) {
      sum += Number(cnpj[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return (
    checkDigit(12) === Number(cnpj[12]) && checkDigit(13) === Number(cnpj[13])
  );
}

export function IsBrazilianPhone(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isBrazilianPhone',
      validator: {
        validate: (value) => isBrazilianPhone(value),
        defaultMessage: buildMessage(
          () => 'Telefone inválido: informe DDD + número',
          options,
        ),
      },
    },
    options,
  );
}

export function IsCpf(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isCpf',
      validator: {
        validate: (value) => isCpf(value),
        defaultMessage: buildMessage(() => 'CPF inválido', options),
      },
    },
    options,
  );
}

export function IsCnpj(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isCnpj',
      validator: {
        validate: (value) => isCnpj(value),
        defaultMessage: buildMessage(() => 'CNPJ inválido', options),
      },
    },
    options,
  );
}

// Nome de pessoa: letras (com acento), espaço, hífen e apóstrofo — "Ana-Clara",
// "João D'Ávila". Número e símbolo (/, !, @…) não entram.
export const PERSON_NAME_PATTERN = /^[\p{L}][\p{L}\s'-]*$/u;

export function isPersonName(value: unknown): boolean {
  return typeof value === 'string' && PERSON_NAME_PATTERN.test(value.trim());
}

export function IsPersonName(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isPersonName',
      validator: {
        validate: (value) => isPersonName(value),
        defaultMessage: buildMessage(
          () =>
            'O nome aceita só letras, espaço, hífen e apóstrofo — sem números ou símbolos',
          options,
        ),
      },
    },
    options,
  );
}

// O CPF é gravado só com dígitos. Sem isso, "529.982.247-25" (importação) e
// "52998224725" (formulário) passavam pelo índice único como CPFs diferentes.
export const toDigits = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/\D/g, '') : value;
