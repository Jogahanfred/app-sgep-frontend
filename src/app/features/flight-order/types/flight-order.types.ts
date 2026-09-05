export type FlightOrderRosterMode = 'promotion' | 'individual';

export const FLIGHT_ORDER_FILTER_ALL = 'all';

export const FLIGHT_ORDER_TREE_MODULES = ['ground', 'air', 'simulator'] as const;
export type FlightOrderTreeModule = (typeof FLIGHT_ORDER_TREE_MODULES)[number];

export const FLIGHT_ORDER_SCHEDULABLE = ['available', 'scheduled', 'recovery', 'update'] as const;

export const FLIGHT_ORDER_SHIFTS = ['morning', 'afternoon', 'night'] as const;
export type FlightOrderShift = (typeof FLIGHT_ORDER_SHIFTS)[number];

export const FLIGHT_ORDER_SHIFT_TIMES: Record<FlightOrderShift, string> = {
  morning: '08:30',
  afternoon: '14:00',
  night: '20:00',
};

export function flightOrderShiftFromTime(time: string): FlightOrderShift {
  const hour = Number.parseInt(time.slice(0, 2), 10);
  if (!Number.isFinite(hour)) return 'morning';
  if (hour >= 18) return 'night';
  if (hour >= 12) return 'afternoon';
  return 'morning';
}
