import { CashboxAuditsService } from './cashbox-audits.service';

// 🔥 mock de utils
jest.mock('../../src/shared/utils/money', () => ({
  roundMoney: (v: number) => v,
  moneyDifference: (a: number, b: number) => a - b
}));

describe('CashboxAuditsService', () => {

  let service: CashboxAuditsService;
  let mockAudits: any;
  let mockSessions: any;
  let mockMovements: any;
  let mockAudit: any;

  beforeEach(() => {

    mockAudits = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
    };

    mockSessions = {
      findById: jest.fn(),
    };

    mockMovements = {
      sumBySession: jest.fn(),
    };

    mockAudit = {
      log: jest.fn(),
    };

    service = new CashboxAuditsService(
      mockAudits,
      mockSessions,
      mockMovements,
      mockAudit
    );
  });

  // ───────────── CREATE ─────────────
  describe('create', () => {

    it('deberia crear un arqueo correctamente', async () => {

      const dto = {
        sesionCajaId: '1',
        saldoContado: 500
      };

      mockSessions.findById.mockResolvedValue({
        id: '1',
        estado: 'ABIERTA',
        saldoInicial: 100
      });

      mockMovements.sumBySession.mockResolvedValue({
        ingresos: 500,
        egresos: 100
      });

      mockAudits.create.mockResolvedValue({
        id: '1'
      });

      const result = await service.create(dto as any, 'user1');

      expect(result).toBeDefined();
      expect(mockAudits.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('deberia lanzar error si la sesion no existe', async () => {

      mockSessions.findById.mockResolvedValue(null);

      const dto = {
        sesionCajaId: '1',
        saldoContado: 100
      };

      await expect(
        service.create(dto as any, 'user1')
      ).rejects.toThrow();
    });

    it('deberia lanzar error si la sesion no esta abierta', async () => {

      mockSessions.findById.mockResolvedValue({
        id: '1',
        estado: 'CERRADA'
      });

      const dto = {
        sesionCajaId: '1',
        saldoContado: 100
      };

      await expect(
        service.create(dto as any, 'user1')
      ).rejects.toThrow();
    });

  });

  // ───────────── GET BY ID ─────────────
  describe('getById', () => {

    it('deberia retornar un arqueo', async () => {

      const record = { id: '1' };

      mockAudits.findById.mockResolvedValue(record);

      const result = await service.getById('1');

      expect(result).toEqual(record);
    });

    it('deberia lanzar error si no existe', async () => {

      mockAudits.findById.mockResolvedValue(null);

      await expect(
        service.getById('1')
      ).rejects.toThrow();
    });

  });

  // ───────────── LIST ─────────────
  describe('list', () => {

    it('deberia retornar arqueos', async () => {

      const data = [{ id: '1' }];

      mockAudits.list.mockResolvedValue(data);

      const result = await service.list({} as any);

      expect(result).toEqual(data);
    });

  });

});