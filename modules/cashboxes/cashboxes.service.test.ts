import { CashboxesService } from './cashboxes.service';

describe('CashboxesService', () => {

  let service: CashboxesService;
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

    service = new CashboxesService(mockRepository);
  });

  describe('create', () => {

    it('deberia crear una cashbox correctamente', async () => {
      const dto = {
        sucursalId: '1',
        codigo: 'CB-001',
        nombre: 'Caja Principal'
      };

      mockRepository.findByCode.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create(dto);

      expect(result).toBeDefined();
    });

    it('deberia lanzar error si el codigo ya existe', async () => {
      const dto = {
        sucursalId: '1',
        codigo: 'CB-001',
        nombre: 'Caja Principal'
      };

      mockRepository.findByCode.mockResolvedValue({ id: '1' });

      await expect(service.create(dto)).rejects.toThrow();
    });

  });

  describe('list', () => {

    it('deberia retornar todas las cashboxes', async () => {
      const data = [{ id: '1', codigo: 'CB-001' }];

      mockRepository.list.mockResolvedValue(data);

      const result = await service.list();

      expect(result).toEqual(data);
    });

  });

  describe('getById', () => {

    it('deberia retornar una cashbox por id', async () => {
      const cashbox = { id: '1', codigo: 'CB-001' };

      mockRepository.findById.mockResolvedValue(cashbox);

      const result = await service.getById('1');

      expect(result).toEqual(cashbox);
    });

    it('deberia lanzar error si no existe', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById('1')).rejects.toThrow();
    });

  });

  describe('update', () => {

    it('deberia actualizar correctamente', async () => {
      const dto = { nombre: 'Nueva Caja' };

      mockRepository.update.mockResolvedValue({ id: '1', ...dto });

      const result = await service.update('1', dto);

      expect(result).toBeDefined();
    });

    it('deberia lanzar error si no existe', async () => {
      mockRepository.update.mockResolvedValue(null);

      await expect(service.update('1', {})).rejects.toThrow();
    });

  });

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

});