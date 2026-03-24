import { CashMovementsService } from './cash-movements.service';

// 🔥 mock roundMoney
jest.mock('../../src/shared/utils/money', () => ({
  roundMoney: (value: number) => value
}));

describe('CashMovementsService', () => {

  let service: CashMovementsService;
  let mockMovements: any;
  let mockSessions: any;
  let mockCashboxes: any;
  let mockAudit: any;

  beforeEach(() => {

    mockMovements = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      voidById: jest.fn(),
      sumBySession: jest.fn(),
    };

    mockSessions = {
      findById: jest.fn(),
      findOpenByCajaId: jest.fn(),
    };

    mockCashboxes = {
      findById: jest.fn(),
    };

    mockAudit = {
      log: jest.fn(),
    };

    service = new CashMovementsService(
      mockMovements,
      mockSessions,
      mockCashboxes,
      mockAudit
    );
  });

  // ───────────── CREATE INGRESO ─────────────
  describe('create - INGRESO', () => {

    it('deberia crear un ingreso correctamente', async () => {

      const dto = {
        tipo: 'INGRESO',
        monto: 100,
        cajaId: '1',
        sesionCajaId: '1'
      };

      mockSessions.findById.mockResolvedValue({
        id: '1',
        estado: 'ABIERTA'
      });

      mockCashboxes.findById.mockResolvedValue({
        limiteOperativo: 1000
      });

      mockMovements.create.mockResolvedValue({ id: '1' });

      const result = await service.create(dto as any, 'user1');

      expect(result).toBeDefined();
      expect(mockMovements.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalled();
    });

  });

  // ───────────── CREATE EGRESO SIN FONDOS ─────────────
  describe('create - EGRESO', () => {

    it('deberia lanzar error si no hay fondos suficientes', async () => {

      const dto = {
        tipo: 'EGRESO',
        monto: 1000,
        cajaId: '1',
        sesionCajaId: '1'
      };

      mockSessions.findById.mockResolvedValue({
        id: '1',
        estado: 'ABIERTA',
        saldoInicial: 100
      });

      mockCashboxes.findById.mockResolvedValue({
        limiteOperativo: 2000
      });

      mockMovements.sumBySession.mockResolvedValue({
        ingresos: 0,
        egresos: 0
      });

      await expect(
        service.create(dto as any, 'user1')
      ).rejects.toThrow();
    });

  });

  // ───────────── GET BY ID ─────────────
  describe('getById', () => {

    it('deberia retornar un movimiento', async () => {

      const movement = { id: '1' };

      mockMovements.findById.mockResolvedValue(movement);

      const result = await service.getById('1');

      expect(result).toEqual(movement);
    });

    it('deberia lanzar error si no existe', async () => {

      mockMovements.findById.mockResolvedValue(null);

      await expect(
        service.getById('1')
      ).rejects.toThrow();
    });

  });

  // ───────────── VOID ─────────────
  describe('void', () => {

    it('deberia anular un movimiento correctamente', async () => {

      mockMovements.findById.mockResolvedValue({
        id: '1',
        estado: 'ACTIVO',
        tipo: 'INGRESO',
        monto: 100,
        moneda: 'DOP',
        sesionCajaId: '1'
      });

      mockSessions.findById.mockResolvedValue({
        id: '1',
        estado: 'ABIERTA'
      });

      mockMovements.voidById.mockResolvedValue({
        id: '1',
        estado: 'ANULADO'
      });

      const result = await service.void('1', 'user1');

      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('deberia lanzar error si ya esta anulado', async () => {

      mockMovements.findById.mockResolvedValue({
        id: '1',
        estado: 'ANULADO'
      });

      await expect(
        service.void('1', 'user1')
      ).rejects.toThrow();
    });

  });

});