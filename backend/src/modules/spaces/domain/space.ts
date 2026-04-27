export type Space = {
  id: string;
  placeId: string;
  iotOfficeId: string;
  name: string;
  locationReference: string | null;
  capacity: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSpaceInput = {
  placeId: string;
  iotOfficeId: string;
  name: string;
  locationReference: string | null;
  capacity: number;
  description: string | null;
};

export type UpdateSpaceInput = Partial<CreateSpaceInput>;
