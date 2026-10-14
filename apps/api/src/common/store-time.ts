// "Hoje" e "este mês" são os do balcão, não os do servidor: rodando em UTC,
// depois das 21h de Brasília o servidor já estaria no dia — ou no mês —
// seguinte.
export const STORE_TIME_ZONE = 'America/Sao_Paulo';

const storeDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: STORE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const storeOffsetFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: STORE_TIME_ZONE,
  timeZoneName: 'longOffset',
});

// Datas sem hora circulam como AAAA-MM-DD, que comparam certo como string.
export const storeToday = () => storeDateFormat.format(new Date());

// O deslocamento vem do fuso, não de uma constante, para seguir sozinho se o
// horário de verão voltar. "GMT-03:00" vira -180 minutos; "GMT" puro é zero.
const storeOffsetMinutes = (at: Date) => {
  const name = storeOffsetFormat
    .formatToParts(at)
    .find((part) => part.type === 'timeZoneName')?.value;
  const match = name?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -minutes : minutes;
};

// 00:00 do dia 1º no balcão, como instante UTC.
const storeMonthStart = (year: number, month: number) => {
  const midnightUtc = new Date(Date.UTC(year, month - 1, 1));
  return new Date(
    midnightUtc.getTime() - storeOffsetMinutes(midnightUtc) * 60_000,
  );
};

// O mês corrente do balcão como intervalo [início, início do próximo), pronto
// para um filtro de data do Prisma.
export const currentStoreMonth = () => {
  const [year, month] = storeToday().split('-').map(Number);
  return {
    gte: storeMonthStart(year, month),
    lt:
      month === 12
        ? storeMonthStart(year + 1, 1)
        : storeMonthStart(year, month + 1),
  };
};
