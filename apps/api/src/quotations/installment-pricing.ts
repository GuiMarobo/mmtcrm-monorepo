// §Cálculo do parcelamento (spec 011): a mesma conta que o front faz na
// simulação (installmentSimulation.ts). Tudo em centavos inteiros; a taxa vira
// centésimos de ponto para a divisão ser exata.
export interface InstallmentPricing {
  totalWithInterestCents: number;
  installmentCents: number;
  firstInstallmentCents: number;
}

// Total com juros: à vista × (1 + taxa ÷ 100), meio para cima. A taxa é
// acréscimo direto, como a maquininha cobra — sem tabela Price.
export function totalWithInterestCents(
  cashCents: number,
  rateHundredths: number,
): number {
  return Math.floor((cashCents * (10_000 + rateHundredths) + 5_000) / 10_000);
}

// Parcela base truncada ao centavo; o resíduo vai para a primeira, para a soma
// das parcelas bater exatamente com o total impresso.
export function splitInstallments(
  totalCents: number,
  installments: number,
): Omit<InstallmentPricing, 'totalWithInterestCents'> {
  const installmentCents = Math.floor(totalCents / installments);
  return {
    installmentCents,
    firstInstallmentCents:
      installmentCents + (totalCents - installmentCents * installments),
  };
}
