import type {
  CreateSpaceInput,
  Space,
  UpdateSpaceInput
} from "../domain/space.js";

export type SpaceRepository = {
  create(input: CreateSpaceInput): Promise<Space>;
  findAll(): Promise<Space[]>;
  findById(id: string): Promise<Space | null>;
  update(id: string, input: UpdateSpaceInput): Promise<Space | null>;
  delete(id: string): Promise<boolean>;
};
