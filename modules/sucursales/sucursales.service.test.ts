import { SucursalesService } from './sucursales.service';

// 🔥 Mock del query (MUY IMPORTANTE)
jest.mock('../../db', () => ({
  query: jest.fn()
}));

import { query } from '../../db';

describe('SucursalesService', () => {

  let service: SucursalesService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    service = new SucursalesService(mockRepository);
  });

  // ───────────── CREATE ─────────────
  describe('create', () => {

    it('deberia crear una sucursal correctamente', async () => {

      const dto = {
        codigo: 'SUC-001',
        nombre: 'Sucursal Principal'
      };

      mockRepository.findByCode.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create(dto as any);

      expect(result).toBeDefined();
    });

    it('deberia lanzar error si el codigo ya existe', async () => {

      const dto = {
        codigo: 'SUC-001',
        nombre: 'Sucursal Principal'
      };

      mockRepository.findByCode.mockResolvedValue({ id: '1' });

      await expect(service.create(dto as any)).rejects.toThrow();
    });

  });

  // ───────────── LIST ─────────────
  describe('list', () => {

    it('deberia retornar todas las sucursales', async () => {

      const data = [{ id: '1', codigo: 'SUC-001' }];

      mockRepository.list.mockResolvedValue(data);

      const result = await service.list();

      expect(result).toEqual(data);
    });

  });

  // ───────────── GET BY ID ─────────────
  describe('getById', () => {

    it('deberia retornar una sucursal por id', async () => {

      const sucursal = { id: '1', codigo: 'SUC-001' };

      mockRepository.findById.mockResolvedValue(sucursal);

      const result = await service.getById('1');

      expect(result).toEqual(sucursal);
    });

    it('deberia lanzar error si no existe', async () => {

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById('1')).rejects.toThrow();
    });

  });

  // ───────────── UPDATE ─────────────
  describe('update', () => {

    it('deberia actualizar correctamente', async () => {

      const dto = { nombre: 'Nueva Sucursal' };

      mockRepository.update.mockResolvedValue({ id: '1', ...dto });

      const result = await service.update('1', dto as any);

      expect(result).toBeDefined();
    });

    it('deberia lanzar error si no existe', async () => {

      mockRepository.update.mockResolvedValue(null);

      await expect(service.update('1', {} as any)).rejects.toThrow();
    });

  });

  // ───────────── DELETE ─────────────
  describe('delete', () => {

    it('deberia eliminar correctamente', async () => {

      mockRepository.delete.mockResolvedValue(true);

      await expect(service.delete('1')).resolves.toBeUndefined();
    });

    it('deberia lanzar error si no existe', async () => {

      mockRepository.delete.mockResolvedValue(false);

      await expect(service.delete('1')).rejects.toThrow();
    });

  });

  // ───────────── 🔥 GET TOTAL SUCURSAL ─────────────
  describe('getTotalSucursal', () => {

    it('deberia calcular y retornar el total correctamente', async () => {

      const sucursal = { id: '1', codigo: 'SUC-001' };

      mockRepository.findById.mockResolvedValue(sucursal);

      // 🔥 MOCK DE QUERY (3 llamadas)
      (query as jest.Mock)
        // movimientos
        .mockResolvedValueOnce({
          rows: [{ ingresos: 1000, egresos: 200 }]
        })
        // atms
        .mockResolvedValueOnce({
          rows: [{ total: 500 }]
        })
        // update
        .mockResolvedValueOnce({});

      const result = await service.getTotalSucursal('1');

      expect(result.total).toBe(1300); // 1000 - 200 + 500
    });

    it('deberia lanzar error si la sucursal no existe', async () => {

      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.getTotalSucursal('1')
      ).rejects.toThrow();
    });

  });

});