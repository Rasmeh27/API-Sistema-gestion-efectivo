import { FundRequestsService } from './fund-requests.service';

// 🔥 mock utils
jest.mock('../../src/shared/utils/money', () => ({
  roundMoney: (v: number) => v
}));

describe('FundRequestsService', () => {

  let service: FundRequestsService;
  let mockRequests: any;
  let mockMovements: any;
  let mockSessions: any;
  let mockAudit: any;

  beforeEach(() => {

    mockRequests = {
      create: jest.fn(),
      findById: jest.fn(),
      resolve: jest.fn(),
      createApproval: jest.fn(),
      execute: jest.fn(),
      list: jest.fn(),
      findApprovalByRequestId: jest.fn(),
    };

    mockMovements = {
      create: jest.fn(),
    };

    mockSessions = {
      findOpenByCajaId: jest.fn(),
    };

    mockAudit = {
      log: jest.fn(),
    };

    service = new FundRequestsService(
      mockRequests,
      mockMovements,
      mockSessions,
      mockAudit
    );
  });

  // ───────────── CREATE ─────────────
  describe('create', () => {

    it('deberia crear una solicitud correctamente', async () => {

      const dto = {
        monto: 100,
        origenScope: 'CAJA',
        origenId: '1',
        destinoScope: 'CAJA',
        destinoId: '2'
      };

      mockRequests.create.mockResolvedValue({ id: '1' });

      const result = await service.create(dto as any, 'user1');

      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalled();
    });

  });

  // ───────────── RESOLVE ─────────────
  describe('resolve', () => {

    it('deberia aprobar una solicitud', async () => {

      mockRequests.findById.mockResolvedValue({
        id: '1',
        estado: 'PENDIENTE'
      });

      mockRequests.resolve.mockResolvedValue({ id: '1' });
      mockRequests.createApproval.mockResolvedValue({ id: 'ap1' });

      const dto = { decision: 'APROBADA' };

      const result = await service.resolve('1', dto as any, 'admin');

      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('deberia lanzar error si ya fue resuelta', async () => {

      mockRequests.findById.mockResolvedValue({
        estado: 'APROBADA'
      });

      await expect(
        service.resolve('1', {} as any, 'admin')
      ).rejects.toThrow();
    });

  });

  // ───────────── EXECUTE ─────────────
  describe('execute', () => {

    it('deberia ejecutar una solicitud correctamente', async () => {

      mockRequests.findById.mockResolvedValue({
        id: '1',
        estado: 'APROBADA',
        monto: 100,
        moneda: 'DOP',
        origenScope: 'CAJA',
        origenId: '1',
        destinoScope: 'CAJA',
        destinoId: '2',
        motivo: 'test'
      });

      mockSessions.findOpenByCajaId
        .mockResolvedValueOnce({ id: 'dest' }) // destino
        .mockResolvedValueOnce({ id: 'orig' }); // origen

      mockRequests.execute.mockResolvedValue({ id: '1' });

      const result = await service.execute('1', 'user1');

      expect(result).toBeDefined();
      expect(mockMovements.create).toHaveBeenCalledTimes(2);
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('deberia lanzar error si no esta aprobada', async () => {

      mockRequests.findById.mockResolvedValue({
        estado: 'PENDIENTE'
      });

      await expect(
        service.execute('1', 'user1')
      ).rejects.toThrow();
    });

  });

  // ───────────── GET BY ID ─────────────
  describe('getById', () => {

    it('deberia retornar solicitud', async () => {

      const req = { id: '1' };

      mockRequests.findById.mockResolvedValue(req);

      const result = await service.getById('1');

      expect(result).toEqual(req);
    });

    it('deberia lanzar error si no existe', async () => {

      mockRequests.findById.mockResolvedValue(null);

      await expect(
        service.getById('1')
      ).rejects.toThrow();
    });

  });

  // ───────────── GET APPROVAL ─────────────
  describe('getApproval', () => {

    it('deberia retornar aprobacion', async () => {

      mockRequests.findById.mockResolvedValue({ id: '1' });
      mockRequests.findApprovalByRequestId.mockResolvedValue({ id: 'ap1' });

      const result = await service.getApproval('1');

      expect(result).toBeDefined();
    });

    it('deberia lanzar error si no existe', async () => {

      mockRequests.findById.mockResolvedValue(null);

      await expect(
        service.getApproval('1')
      ).rejects.toThrow();
    });

  });

});