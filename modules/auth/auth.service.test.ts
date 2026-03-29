import { AuthService } from './auth.service';

describe('AuthService', () => {

  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {
        log: jest.fn()
      } as any
    );
  });

  // 🔥 Agrupamos por funcionalidad
  describe('login', () => {

    // ✅ LOGIN EXITOSO
    it('deberia hacer login correctamente', async () => {

      const loginDto = {
        email: 'kevin@test.com',
        password: '123456'
      };

      const meta = {
        ip: '127.0.0.1',
        userAgent: 'jest-test'
      };

      (authService as any).findActiveUser = jest.fn().mockResolvedValue({
        id: 1,
        email: 'kevin@test.com',
        passwordHash: 'hashedPassword',
        roles: [],
        permissions: []
      });

      (authService as any).verifyPassword = jest.fn().mockResolvedValue(true);

      (authService as any).createSessionTokens = jest.fn().mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh'
      });

      const result = await authService.login(loginDto, meta);

      expect(result).toBeDefined();
    });

    // ❌ PASSWORD INCORRECTO
    it('deberia lanzar error si la contraseña es incorrecta', async () => {

      const loginDto = {
        email: 'kevin@test.com',
        password: 'wrongpass'
      };

      const meta = {
        ip: '127.0.0.1',
        userAgent: 'jest-test'
      };

      (authService as any).findActiveUser = jest.fn().mockResolvedValue({
        id: 1,
        email: 'kevin@test.com',
        passwordHash: 'hashedPassword',
        roles: [],
        permissions: []
      });

      (authService as any).verifyPassword = jest.fn().mockRejectedValue(
        new Error('Invalid password')
      );

      await expect(
        authService.login(loginDto, meta)
      ).rejects.toThrow();
    });

    // ❌ USUARIO NO EXISTE
    it('deberia lanzar error si el usuario no existe', async () => {

      const loginDto = {
        email: 'noexiste@test.com',
        password: '123456'
      };

      const meta = {
        ip: '127.0.0.1',
        userAgent: 'jest-test'
      };

      (authService as any).findActiveUser = jest.fn().mockRejectedValue(
        new Error('User not found')
      );

      await expect(
        authService.login(loginDto, meta)
      ).rejects.toThrow();
    });

  });

});