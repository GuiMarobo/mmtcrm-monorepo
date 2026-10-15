import { currentStoreMonth, storeToday } from './store-time';

describe('store-time', () => {
  const at = (iso: string) =>
    jest.useFakeTimers({
      now: new Date(iso),
      doNotFake: ['nextTick', 'setImmediate'],
    });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('hoje é o dia do balcão: 22h de Brasília ainda não virou o dia', () => {
    at('2026-11-01T01:00:00Z');

    expect(storeToday()).toBe('2026-10-31');
  });

  it('o mês começa à meia-noite de Brasília, 03:00 UTC', () => {
    at('2026-10-14T15:00:00Z');

    expect(currentStoreMonth()).toEqual({
      gte: new Date('2026-10-01T03:00:00Z'),
      lt: new Date('2026-11-01T03:00:00Z'),
    });
  });

  it('dezembro fecha o intervalo em janeiro do ano seguinte', () => {
    at('2026-12-20T12:00:00Z');

    expect(currentStoreMonth()).toEqual({
      gte: new Date('2026-12-01T03:00:00Z'),
      lt: new Date('2027-01-01T03:00:00Z'),
    });
  });
});
