/** Headline numbers for the therapist's dashboard, as the app models them. */
export interface DashboardSummary {
  /** Sessions completed in the current calendar month (IST). */
  readonly completedThisMonth: number;
  readonly completedAllTime: number;
  /** When the therapist started taking sessions, if the API provides it. */
  readonly activeSince: Date | null;
}
