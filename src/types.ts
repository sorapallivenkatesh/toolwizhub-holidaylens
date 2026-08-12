export interface Env {
  CACHE_TTL?: string;
}

export class HolidayLensError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = "HolidayLensError";
  }
}

export type HolidayType = "gazetted" | "restricted" | "optional" | "bank";
export type HolidayScope = "national" | "state";
export type Confidence = "official" | "provisional" | "estimated";

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: HolidayType;
  scope: HolidayScope;
  confidence?: Confidence;
  religions?: string[];
}

export interface HolidayYearFile {
  year: number;
  source: string;
  updatedAt: string;
  holidays: Holiday[];
}

export interface StateInfo {
  code: string;
  name: string;
}

export type WeekendMode = "sat-sun" | "sun-only";

export interface OptimizeInput {
  state: string;
  year: number;
  leaves: number;
  weekend: WeekendMode;
  includeRestricted: boolean;
  maxPlans: number;
}

export interface LeavePlan {
  id: string;
  from: string;
  to: string;
  leavesUsed: number;
  weekends: number;
  holidays: number;
  totalOff: number;
  efficiency: number;
  leaveDates: string[];
  holidayNames: string[];
  label: string;
}
