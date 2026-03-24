import { UsersService } from './users.service';

describe('UsersService', () => {

  let service: UsersService;
  let mockRepository: any;
  let mockPasswordService: any;
  let mockAudit: any;

  beforeEach(() => {

    mockRepository = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockPasswordService = {
      hash: jest.fn(),
    };

    mockAudit = {
      log: jest.fn(),
    };

    service = new UsersService(
      mockRepository,
      mockPasswordService,
      mockAudit
    );
  });

  // ───────────── CREATE ─────────────
  describe('create', () => {

    it('deberia crear un usuario correctamente', async () => {

      const dto = {
        name: 'Kevin',
        email: 'kevin@test.com',
        password: '123456',
        roleIds: []
      };

      mockRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashedPassword');
      mockRepository.create.mockResolvedValue({
        id: '1',
        ...dto,
        passwordHash: 'hashedPassword',
        status: 'ACTIVO'
      });

      const result = await service.create(dto as any);

      expect(result).toBeDefined();
      expect(mockPasswordService.hash).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('deberia lanzar error si el email ya existe', async () => {

      const dto = {
        email: 'kevin@test.com',
        password: '123456'
      };

      mockRepository.findByEmail.mockResolvedValue({ id: '1' });

      await expect(
        service.create(dto as any)
      ).rejects.toThrow();
    });

  });

  // ───────────── LIST ─────────────
  describe('list', () => {

    it('deberia retornar usuarios paginados', async () => {

      const query = {
        page: 1,
        perPage: 10,
        status: undefined,
        roleIds: undefined
      };

      const response = {
        items: [{ id: '1', email: 'test@test.com' }],
        total: 1
      };

      mockRepository.list.mockResolvedValue(response);

      const result = await service.list(query as any);

      expect(result).toEqual(response);
    });

  });

  // ───────────── GET BY ID ─────────────
  describe('getById', () => {

    it('deberia retornar un usuario', async () => {

      const user = { id: '1', email: 'test@test.com' };

      mockRepository.findById.mockResolvedValue(user);

      const result = await service.getById('1');

      expect(result).toEqual(user);
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

    it('deberia actualizar usuario correctamente', async () => {

      const patch = { name: 'Nuevo Nombre' };

      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue({ id: '1' });
      mockRepository.update.mockResolvedValue({
        id: '1',
        ...patch
      });

      const result = await service.update('1', patch as any);

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

  // ───────────── UPDATE STATUS ─────────────
  describe('updateStatus', () => {

    it('deberia cambiar el estado correctamente', async () => {

      mockRepository.findById.mockResolvedValue({ id: '1', status: 'ACTIVO' });
      mockRepository.updateStatus.mockResolvedValue({
        id: '1',
        status: 'BLOQUEADO'
      });

      const result = await service.updateStatus('1', 'BLOQUEADO');

      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('deberia lanzar error si no existe', async () => {

      mockRepository.updateStatus.mockResolvedValue(null);

      await expect(
        service.updateStatus('1', 'BLOQUEADO')
      ).rejects.toThrow();
    });

  });

  // ───────────── DEACTIVATE ─────────────
  describe('deactivate', () => {

    it('deberia bloquear el usuario', async () => {

      jest.spyOn(service, 'updateStatus').mockResolvedValue({
        id: '1',
        status: 'BLOQUEADO'
      } as any);

      const result = await service.deactivate('1');

      expect(result.status).toBe('BLOQUEADO');
    });

  });

});