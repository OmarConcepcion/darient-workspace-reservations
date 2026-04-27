export type Place = {
  id: string;
  iotSiteId: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePlaceInput = {
  iotSiteId: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type UpdatePlaceInput = Partial<CreatePlaceInput>;
