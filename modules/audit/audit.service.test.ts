import { AuditService } from './audit.service';

describe('AuditService', () => {

  let service: AuditService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
    };

    service = new AuditService(mockRepository);
  });

  // ───────────── CREATE ─────────────
  describe('create', () => {

    it('deberia crear un evento de auditoria', async () => {

      const dto = {
        accion: 'LOGIN',
        entidadTipo: 'USUARIO',
        entidadId: '1'
      };

      mockRepository.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create(dto as any);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
    });

  });

  // ───────────── GET BY ID ─────────────
  describe('getById', () => {

    it('deberia retornar un evento', async () => {

      const event = { id: '1' };

      mockRepository.findById.mockResolvedValue(event);

      const result = await service.getById('1');

      expect(result).toEqual(event);
    });

    it('deberia lanzar error si no existe', async () => {

      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.getById('1')
      ).rejects.toThrow();
    });

  });

  // ───────────── LIST ─────────────
  describe('list', () => {

    it('deberia retornar eventos correctamente', async () => {

      const filters = {};

      const events = [{ id: '1' }];

      mockRepository.list.mockResolvedValue(events);

      const result = await service.list(filters as any);

      expect(result).toEqual(events);
    });

    it('deberia lanzar error si el rango de fechas es invalido', async () => {

      const filters = {
        desde: '2024-01-10',
        hasta: '2024-01-01'
      };

      await expect(
        service.list(filters as any)
      ).rejects.toThrow();
    });

  });

});