import { AppError } from "../../../shared/errors/app-error.js";
import type { PlaceRepository } from "../../places/ports/place-repository.js";
import type {
  CreateSpaceInput,
  Space,
  UpdateSpaceInput
} from "../domain/space.js";
import type { SpaceRepository } from "../ports/space-repository.js";

export class SpaceService {
  public constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly placeRepository: PlaceRepository
  ) {}

  public async create(input: CreateSpaceInput): Promise<Space> {
    const place = await this.placeRepository.findById(input.placeId);

    if (!place) {
      throw new AppError(404, "PLACE_NOT_FOUND", "Place not found.");
    }

    return this.spaceRepository.create(input);
  }

  public list(): Promise<Space[]> {
    return this.spaceRepository.findAll();
  }

  public async get(id: string): Promise<Space> {
    const space = await this.spaceRepository.findById(id);

    if (!space) {
      throw new AppError(404, "SPACE_NOT_FOUND", "Space not found.");
    }

    return space;
  }

  public async update(id: string, input: UpdateSpaceInput): Promise<Space> {
    if (input.placeId) {
      const place = await this.placeRepository.findById(input.placeId);

      if (!place) {
        throw new AppError(404, "PLACE_NOT_FOUND", "Place not found.");
      }
    }

    const space = await this.spaceRepository.update(id, input);

    if (!space) {
      throw new AppError(404, "SPACE_NOT_FOUND", "Space not found.");
    }

    return space;
  }

  public async delete(id: string): Promise<void> {
    const deleted = await this.spaceRepository.delete(id);

    if (!deleted) {
      throw new AppError(404, "SPACE_NOT_FOUND", "Space not found.");
    }
  }
}
