import { CashboxesRepository } from "./cashboxes.postgres-repository";
import { CreateCashboxDto, UpdateCashboxDto } from "./cashboxes.dto";

export class CashboxesService {

  constructor(private readonly repo: CashboxesRepository) {}

  async create(dto: CreateCashboxDto) {

    // validación de negocio
    if (dto.estado === "BLOQUEADA") {
      throw new Error("No se puede crear una caja en estado BLOQUEADA");
    }

    return this.repo.create(dto);
  }

  async findAll() {
    return this.repo.findAll();
  }

  async update(id: string, dto: UpdateCashboxDto) {

    if (!id || id.trim().length === 0) {
      throw new Error("El id de la caja es requerido");
    }

    if (Object.keys(dto).length === 0) {
      throw new Error("Debe enviar al menos un campo para actualizar");
    }

    return this.repo.update(id, dto);
  }

}