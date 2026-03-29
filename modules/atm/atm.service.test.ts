import { AtmService } from './atm.services';

describe('AtmService', () => {

  let service: AtmService;
  let mockRepository: any;
  let mockCashMovements: any;
  let mockSucursales: any;

  beforeEach(() => {

    mockRepository = {
      findById: jest.fn(),
      deposit: jest.fn(),
      withdraw: jest.fn(),
    };

    mockCashMovements = {
      create: jest.fn(),
    };

    mockSucursales = {
      getTotalSucursal: jest.fn(),
    };

    service = new AtmService(
      mockRepository,
      mockCashMovements,
      mockSucursales
    );
  });

  // ───────────── GET BY ID ─────────────
  describe('getById', () => {

    it('deberia retornar un ATM', async () => {

      const atm = { id: '1' };

      mockRepository.findById.mockResolvedValue(atm);

      const result = await service.getById('1');

      expect(result).toEqual(atm);
    });

    it('deberia lanzar error si no existe', async () => {

      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.getById('1')
      ).rejects.toThrow();
    });

  });

  // ───────────── DEPOSIT ─────────────
  describe('deposit', () => {

    it('deberia hacer deposito correctamente', async () => {

      const atm = {
        id: '1',
        codigo: 'ATM-1',
        moneda: 'DOP',
        cajaId: '1',
        sucursalId: '1'
      };

      const dto = {
        monto: 100,
        motivo: 'Deposito test'
      };

      mockRepository.deposit.mockResolvedValue(atm);

      const result = await service.deposit('1', dto as any, 'user1', 'sesion1');

      expect(result).toEqual(atm);
      expect(mockCashMovements.create).toHaveBeenCalled();
      expect(mockSucursales.getTotalSucursal).toHaveBeenCalledWith('1');
    });

    it('deberia lanzar error si el monto es invalido', async () => {

      const dto = { monto: 0 };

      await expect(
        service.deposit('1', dto as any, 'user1', 'sesion1')
      ).rejects.toThrow();
    });

    it('deberia lanzar error si el ATM no existe', async () => {

      mockRepository.deposit.mockResolvedValue(null);

      const dto = { monto: 100 };

      await expect(
        service.deposit('1', dto as any, 'user1', 'sesion1')
      ).rejects.toThrow();
    });

  });

  // ───────────── WITHDRAW ─────────────
  describe('withdraw', () => {

    it('deberia hacer retiro correctamente', async () => {

      const atm = {
        id: '1',
        codigo: 'ATM-1',
        moneda: 'DOP',
        cajaId: '1',
        sucursalId: '1'
      };

      const dto = {
        monto: 50,
        motivo: 'Retiro test'
      };

      mockRepository.withdraw.mockResolvedValue(atm);

      const result = await service.withdraw('1', dto as any, 'user1', 'sesion1');

      expect(result).toEqual(atm);
      expect(mockCashMovements.create).toHaveBeenCalled();
      expect(mockSucursales.getTotalSucursal).toHaveBeenCalledWith('1');
    });

    it('deberia lanzar error si el monto es invalido', async () => {

      const dto = { monto: -10 };

      await expect(
        service.withdraw('1', dto as any, 'user1', 'sesion1')
      ).rejects.toThrow();
    });

    it('deberia lanzar error si no hay fondos', async () => {

      mockRepository.withdraw.mockResolvedValue(null);

      const dto = { monto: 100 };

      await expect(
        service.withdraw('1', dto as any, 'user1', 'sesion1')
      ).rejects.toThrow();
    });

  });

});