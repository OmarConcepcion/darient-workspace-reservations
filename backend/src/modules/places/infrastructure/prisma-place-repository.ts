import type { PrismaClient } from "@prisma/client";

import { prisma } from "../../../shared/prisma/prisma.js";
import type {
  CreatePlaceInput,
  Place,
  UpdatePlaceInput
} from "../domain/place.js";
import type { PlaceRepository } from "../ports/place-repository.js";

export class PrismaPlaceRepository implements PlaceRepository {
  public constructor(private readonly client: PrismaClient = prisma) {}

  public async create(input: CreatePlaceInput): Promise<Place> {
    return this.client.place.create({
      data: input
    });
  }

  public async findAll(): Promise<Place[]> {
    return this.client.place.findMany({
      orderBy: { createdAt: "asc" }
    });
  }

  public async findById(id: string): Promise<Place | null> {
    return this.client.place.findUnique({
      where: { id }
    });
  }

  public async update(id: string, input: UpdatePlaceInput): Promise<Place | null> {
    const result = await this.client.place.updateManyAndReturn({
      where: { id },
      data: input
    });

    return result[0] ?? null;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.client.place.deleteMany({
      where: { id }
    });

    return result.count > 0;
  }
}
