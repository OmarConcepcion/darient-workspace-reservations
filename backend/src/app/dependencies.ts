import { PrismaIotRepository } from "../modules/iot/infrastructure/prisma-iot-repository.js";
import { MqttJsPublisher } from "../modules/iot/infrastructure/mqtt-js-publisher.js";
import type { IotRepository } from "../modules/iot/ports/iot-repository.js";
import type { MqttPublisher } from "../modules/iot/ports/mqtt-publisher.js";
import { PrismaPlaceRepository } from "../modules/places/infrastructure/prisma-place-repository.js";
import type { PlaceRepository } from "../modules/places/ports/place-repository.js";
import { PrismaReservationRepository } from "../modules/reservations/infrastructure/prisma-reservation-repository.js";
import type { ReservationRepository } from "../modules/reservations/ports/reservation-repository.js";
import { PrismaSpaceRepository } from "../modules/spaces/infrastructure/prisma-space-repository.js";
import type { SpaceRepository } from "../modules/spaces/ports/space-repository.js";
import { InMemorySsePublisher } from "../shared/sse/in-memory-sse-publisher.js";

export type AppDependencies = {
  placeRepository: PlaceRepository;
  spaceRepository: SpaceRepository;
  reservationRepository: ReservationRepository;
  iotRepository: IotRepository;
  mqttPublisher: MqttPublisher;
  ssePublisher: InMemorySsePublisher;
  nowProvider: () => Date;
};

export const createDefaultDependencies = (): AppDependencies => ({
  placeRepository: new PrismaPlaceRepository(),
  spaceRepository: new PrismaSpaceRepository(),
  reservationRepository: new PrismaReservationRepository(),
  iotRepository: new PrismaIotRepository(),
  mqttPublisher: new MqttJsPublisher(),
  ssePublisher: new InMemorySsePublisher(),
  nowProvider: () => new Date()
});
