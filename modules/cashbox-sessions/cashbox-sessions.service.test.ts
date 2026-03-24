import { CashboxSessionsService } from './cashbox-sessions.service';

// 🔥 mocks de utils
jest.mock('../../src/shared/utils/date', () => ({
  nowISO: () => '2024-01-01T00:00:00Z'
}));

jest.mock('../../src/shared/utils/money', () => ({
  roundMoney: (v: number) => v,
  moneyDifference: (a: number, b: number) => a - b
}));

describe('CashboxSessionsService', () => {

  let service: CashboxSessionsService;
  let mockSessions: any;
  let mockCashboxes: any;
  let mockMovements: any;
  let mockAudit: any;

  beforeEach(() => {

    mockSessions = {
      create: jest.fn(),
      findById: jest.fn(),
      findOpenByCajaId: jest.fn(),
      close: jest.fn(),
      list: jest.fn(),
    };

    mockCashboxes = {
      findById: jest.fn(),
    };

    mockMovements = {
      sumBySession: jest.fn(),
    };

    mockAudit = {
      log: jest.fn(),
    };

    service = new CashboxSessionsService(
      mockSessions,
      mockCashboxes,
      mockMovements,
      mockAudit
    );
  });

  // ───────────── OPEN ─────────────
  describe('open', () => {

    it('deberia abrir una sesion correctamente', async () => {

      const dto = {
        cajaId: '1',
        saldoInicial: 100
      };

      mockCashboxes.findById.mockResolvedValue({
        id: '1',
        estado: 'ACTIVA'
      });

      mockSessions.findOpenByCajaId.mockResolvedValue(null);

      mockSessions.create.mockResolvedValue({ id: '1' });

      const result = await service.open(dto as any, 'user1');

      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('deberia lanzar error si la caja no existe', async () => {

      mockCashboxes.findById.mockResolvedValue(null);

      const dto = { cajaId: '1', saldoInicial: 100 };

      await expect(
        service.open(dto as any, 'user1')
      ).rejects.toThrow();
    });

    it('deberia lanzar error si la caja esta inactiva', async () => {

      mockCashboxes.findById.mockResolvedValue({
        estado: 'INACTIVA'
      });

      const dto = { cajaId: '1', saldoInicial: 100 };

      await expect(
        service.open(dto as any, 'user1')
      ).rejects.toThrow();
    });

    it('deberia lanzar error si ya hay una sesion abierta', async () => {

      mockCashboxes.findById.mockResolvedValue({
        estado: 'ACTIVA'
      });

      mockSessions.findOpenByCajaId.mockResolvedValue({ id: '1' });

      const dto = { cajaId: '1', saldoInicial: 100 };

      await expect(
        service.open(dto as any, 'user1')
      ).rejects.toThrow();
    });

  });

  // ───────────── CLOSE ─────────────
  describe('close', () => {

    it('deberia cerrar una sesion correctamente', async () => {

      mockSessions.findById.mockResolvedValue({
        id: '1',
        estado: 'ABIERTA',
        saldoInicial: 100
      });

      mockMovements.sumBySession.mockResolvedValue({
        ingresos: 200,
        egresos: 50
      });

      mockSessions.close.mockResolvedValue({ id: '1' });

      const dto = { saldoFinalReal: 200 };

      const result = await service.close('1', dto as any, 'user1');

      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('deberia lanzar error si no existe', async () => {

      mockSessions.findById.mockResolvedValue(null);

      await expect(
        service.close('1', { saldoFinalReal: 100 } as any, 'user1')
      ).rejects.toThrow();
    });

    it('deberia lanzar error si ya esta cerrada', async () => {

      mockSessions.findById.mockResolvedValue({
        estado: 'CERRADA'
      });

      await expect(
        service.close('1', { saldoFinalReal: 100 } as any, 'user1')
      ).rejects.toThrow();
    });

  });

  // ───────────── GET BY ID ─────────────
  describe('getById', () => {

    it('deberia retornar una sesion', async () => {

      const session = { id: '1' };

      mockSessions.findById.mockResolvedValue(session);

      const result = await service.getById('1');

      expect(result).toEqual(session);
    });

    it('deberia lanzar error si no existe', async () => {

      mockSessions.findById.mockResolvedValue(null);

      await expect(
        service.getById('1')
      ).rejects.toThrow();
    });

  });

  // ───────────── LIST ─────────────
  describe('list', () => {

    it('deberia retornar sesiones paginadas', async () => {

      const response = {
        items: [{ id: '1' }],
        total: 1
      };

      mockSessions.list.mockResolvedValue(response);

      const result = await service.list({
        page: 1,
        perPage: 10
      } as any);

      expect(result).toEqual(response);
    });

  });

});