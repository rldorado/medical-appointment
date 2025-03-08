export interface Slot {
  start: string;
  end: string;
  available: boolean;
}

export interface WeeklySlots {
  date: string;
  slots: Slot[];
}