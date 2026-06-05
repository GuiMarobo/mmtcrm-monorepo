export class ImportRowErrorDto {
    rowNumber!: number                  // linha do erro
    field?: string                      // qual campo deu erro
    message!: string                    // "E-mail inválido, Cpf ja cadastrado e afins"
    rawData?: Record<string, string>    // linha original
}