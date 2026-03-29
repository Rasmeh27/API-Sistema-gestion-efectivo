import { RolesService } from './roles.service';

describe('RolesService', () => {

  let service: RolesService;
  let mockRepository: any;
  let mockAudit: any;

  beforeEach(() => {

    mockRepository = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      isAssignedToUsers: jest.fn(),
      countPermissionsByIds: jest.fn(),
    };

    mockAudit = {
      log: jest.fn(),
    };

    service = new RolesService(
      mockRepository,
      mockAudit
    );
  });

  // ───────────── CREATE ─────────────
  describe('create', () => {

    it('deberia crear un rol correctamente', async () => {

      const dto = {
        nombre: 'ADMIN',
        permissionsIds: ['1', '2']
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.countPermissionsByIds.mockResolvedValue(2);
      mockRepository.create.mockResolvedValue({
        id: '1',
        nombre: 'ADMIN',
        permissions: []
      });

      const result = await service.create(dto as any);

      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('deberia lanzar error si el nombre ya existe', async () => {

      const dto = {
        nombre: 'ADMIN',
        permissionsIds: []
      };

      mockRepository.findByName.mockResolvedValue({ id: '1' });

      await expect(
        service.create(dto as any)
      ).rejects.toThrow();
    });

    it('deberia lanzar error si los permisos no son validos', async () => {

      const dto = {
        nombre: 'ADMIN',
        permissionsIds: ['1', '2']
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.countPermissionsByIds.mockResolvedValue(1);

      await expect(
        service.create(dto as any)
      ).rejects.toThrow();
    });

  });

  // ───────────── LIST ─────────────
  describe('list', () => {

    it('deberia retornar todos los roles', async () => {

      const roles = [{ id: '1', nombre: 'ADMIN' }];

      mockRepository.list.mockResolvedValue(roles);

      const result = await service.list();

      expect(result).toEqual(roles);
    });

  });

  // ───────────── GET BY ID ─────────────
  describe('getById', () => {

    it('deberia retornar un rol', async () => {

      const role = { id: '1', nombre: 'ADMIN' };

      mockRepository.findById.mockResolvedValue(role);

      const result = await service.getById('1');

      expect(result).toEqual(role);
    });

    it('deberia lanzar error si no existe', async () => {

      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.getById('1')
      ).rejects.toThrow();
    });

  });

  // ───────────── UPDATE ─────────────
  describe('update', () => {

    it('deberia actualizar un rol correctamente', async () => {

      const dto = {
        nombre: 'ADMIN_UPDATED',
        permissionsIds: ['1']
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.countPermissionsByIds.mockResolvedValue(1);
      mockRepository.findById.mockResolvedValue({ id: '1', nombre: 'ADMIN' });
      mockRepository.update.mockResolvedValue({
        id: '1',
        nombre: 'ADMIN_UPDATED',
        permissions: []
      });

      const result = await service.update('1', dto as any);

      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('deberia lanzar error si no existe', async () => {

      mockRepository.update.mockResolvedValue(null);

      await expect(
        service.update('1', {} as any)
      ).rejects.toThrow();
    });

  });

  // ───────────── DELETE ─────────────
  describe('delete', () => {

    it('deberia eliminar un rol correctamente', async () => {

      mockRepository.isAssignedToUsers.mockResolvedValue(false);
      mockRepository.findById.mockResolvedValue({ id: '1', nombre: 'ADMIN' });
      mockRepository.delete.mockResolvedValue(true);

      await expect(
        service.delete('1')
      ).resolves.toBeUndefined();

      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('deberia lanzar error si el rol esta en uso', async () => {

      mockRepository.isAssignedToUsers.mockResolvedValue(true);

      await expect(
        service.delete('1')
      ).rejects.toThrow();
    });

    it('deberia lanzar error si no existe', async () => {

      mockRepository.isAssignedToUsers.mockResolvedValue(false);
      mockRepository.delete.mockResolvedValue(false);

      await expect(
        service.delete('1')
      ).rejects.toThrow();
    });

  });

});