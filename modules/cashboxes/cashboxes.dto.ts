export type CashboxStatus = "ACTIVA" | "INACTIVA" | "BLOQUEADA";

export type CreateCashboxDto = {
  sucursalId: string;
  codigo: string;
  nombre: string;
  estado: CashboxStatus;
  moneda?: string;
  limiteOperativo?: number;
};

export type UpdateCashboxDto = {
  sucursalId?: string;
  codigo?: string;
  nombre?: string;
  estado?: CashboxStatus;
  moneda?: string;
  limiteOperativo?: number;
};

export type CashboxRecord = {
  id: string;
  sucursalId: string;
  codigo: string;
  nombre: string;
  estado: CashboxStatus;
  moneda?: string;
  limiteOperativo?: number;
};

export function parseCreateCashbox(body: unknown): CreateCashboxDto {
  if (!body || typeof body !== "object") {
    throw new Error("Cuerpo debe ser un objeto.");
  }

  const b = body as any;

  if (typeof b.sucursalId !== "string" || !b.sucursalId.trim()) {
    throw new Error("sucursalId es requerido");
  }

  if (typeof b.codigo !== "string" || !b.codigo.trim()) {
    throw new Error("codigo es requerido");
  }

  if (typeof b.nombre !== "string" || !b.nombre.trim()) {
    throw new Error("nombre es requerido");
  }

  if (b.estado !== "ACTIVA" && b.estado !== "INACTIVA" && b.estado !== "BLOQUEADA") {
    throw new Error("estado inválido");
  }

  let limite: number | undefined;

  if (b.limiteOperativo !== undefined) {
    if (typeof b.limiteOperativo !== "number") {
      throw new Error("limiteOperativo debe ser número");
    }
    limite = b.limiteOperativo;
  }

  return {
    sucursalId: b.sucursalId.trim(),
    codigo: b.codigo.trim(),
    nombre: b.nombre.trim(),
    estado: b.estado,
    moneda: typeof b.moneda === "string" ? b.moneda.trim() : "DOP",
    limiteOperativo: limite
  };
}

export function parseUpdateCashbox(body: unknown): UpdateCashboxDto {
  if (!body || typeof body !== "object") {
    throw new Error("Cuerpo debe ser un objeto.");
  }

  const b = body as any;
  const dto: UpdateCashboxDto = {};

  if (b.sucursalId !== undefined) {
    if (typeof b.sucursalId !== "string" || !b.sucursalId.trim()) {
      throw new Error("sucursalId inválido");
    }
    dto.sucursalId = b.sucursalId.trim();
  }

  if (b.codigo !== undefined) {
    if (typeof b.codigo !== "string" || !b.codigo.trim()) {
      throw new Error("codigo inválido");
    }
    dto.codigo = b.codigo.trim();
  }

  if (b.nombre !== undefined) {
    if (typeof b.nombre !== "string" || !b.nombre.trim()) {
      throw new Error("nombre inválido");
    }
    dto.nombre = b.nombre.trim();
  }

  if (b.estado !== undefined) {
    if (b.estado !== "ACTIVA" && b.estado !== "INACTIVA" && b.estado !== "BLOQUEADA") {
      throw new Error("estado inválido");
    }
    dto.estado = b.estado;
  }

  if (b.moneda !== undefined) {
    if (typeof b.moneda !== "string") {
      throw new Error("moneda inválida");
    }
    dto.moneda = b.moneda.trim();
  }

  if (b.limiteOperativo !== undefined) {
    if (typeof b.limiteOperativo !== "number") {
      throw new Error("limiteOperativo debe ser número");
    }
    dto.limiteOperativo = b.limiteOperativo;
  }

  return dto;
}