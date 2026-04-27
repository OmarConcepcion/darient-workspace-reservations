import type {
  CreatePlaceInput,
  Place,
  UpdatePlaceInput
} from "../domain/place.js";

export type PlaceRepository = {
  create(input: CreatePlaceInput): Promise<Place>;
  findAll(): Promise<Place[]>;
  findById(id: string): Promise<Place | null>;
  update(id: string, input: UpdatePlaceInput): Promise<Place | null>;
  delete(id: string): Promise<boolean>;
};
