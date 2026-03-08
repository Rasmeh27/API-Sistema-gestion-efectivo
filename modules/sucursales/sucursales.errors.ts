export class SucursalError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export const SucursalErrors = {
  notFound: (id: string) =>
    new SucursalError("SUCURSAL_NOT_FOUND", 404, `Sucursal no encontrada: ${id}`),
  codeConflict: (codigo: string) =>
    new SucursalError("SUCURSAL_CODE_CONFLICT", 409, `Ya existe una sucursal con código "${codigo}"`),
};