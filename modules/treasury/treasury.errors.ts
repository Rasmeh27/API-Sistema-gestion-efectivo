export class TreasuryError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export const TreasuryErrors = {
  notFound: (id: string) =>
    new TreasuryError("TREASURY_NOT_FOUND", 404, `Tesorería no encontrada: ${id}`),
  codeConflict: (codigo: string) =>
    new TreasuryError("TREASURY_CODE_CONFLICT", 409, `Ya existe una tesorería con código "${codigo}"`),
};