import type { PrismaClient } from "@prisma/client";

import { prisma } from "../../../shared/prisma/prisma.js";
import type {
  CreateSpaceInput,
  Space,
  UpdateSpaceInput
} from "../domain/space.js";
import type { SpaceRepository } from "../ports/space-repository.js";

export class PrismaSpaceRepository implements SpaceRepository {
  public constructor(private readonly client: PrismaClient = prisma) {}

  public async create(input: CreateSpaceInput): Promise<Space> {
    return this.client.space.create({
      data: input
    });
  }

  public async findAll(): Promise<Space[]> {
    return this.client.space.findMany({
      orderBy: { createdAt: "asc" }
    });
  }

  public async findById(id: string): Promise<Space | null> {
    return this.client.space.findUnique({
      where: { id }
    });
  }

  public async update(id: string, input: UpdateSpaceInput): Promise<Space | null> {
    const result = await this.client.space.updateManyAndReturn({
      where: { id },
      data: input
    });

    return result[0] ?? null;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.client.space.deleteMany({
      where: { id }
    });

    return result.count > 0;
  }
}
