/** Headline numbers for the aapta's dashboard, as the app models them. */
export interface DashboardSummary {
  /** Sessions completed in the current calendar month (IST). */
  readonly completedThisMonth: number;
  /** Sessions completed from 30 days ago up to today (IST). */
  readonly completedLast30Days: number;
}
