import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

type UseDndSensorsOptions = {
	activationDistance?: number;
};

export const useDndSensors = (options: UseDndSensorsOptions = {}) => {
	const { activationDistance = 8 } = options;

	return useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: activationDistance,
			},
		}),
	);
};
