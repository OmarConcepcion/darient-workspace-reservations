import { AppError } from "../../../shared/errors/app-error.js";
import type {
  CreatePlaceInput,
  Place,
  UpdatePlaceInput
} from "../domain/place.js";
import type { PlaceRepository } from "../ports/place-repository.js";

export class PlaceService {
  public constructor(private readonly placeRepository: PlaceRepository) {}

  public create(input: CreatePlaceInput): Promise<Place> {
    return this.placeRepository.create(input);
  }

  public list(): Promise<Place[]> {
    return this.placeRepository.findAll();
  }

  public async get(id: string): Promise<Place> {
    const place = await this.placeRepository.findById(id);

    if (!place) {
      throw new AppError(404, "PLACE_NOT_FOUND", "Place not found.");
    }

    return place;
  }

  public async update(id: string, input: UpdatePlaceInput): Promise<Place> {
    const place = await this.placeRepository.update(id, input);

    if (!place) {
      throw new AppError(404, "PLACE_NOT_FOUND", "Place not found.");
    }

    return place;
  }

  public async delete(id: string): Promise<void> {
    const deleted = await this.placeRepository.delete(id);

    if (!deleted) {
      throw new AppError(404, "PLACE_NOT_FOUND", "Place not found.");
    }
  }
}
