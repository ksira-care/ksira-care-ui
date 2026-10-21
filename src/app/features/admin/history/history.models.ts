import { AaptaRef, Client, Outcome } from '../admin.models';

/** A calendar month, "2026-10". */
export type MonthKey = string;

export interface HistorySummary {
  readonly total: number;
  readonly completed: number;
  readonly clientNoShow: number;
  /** Aapta no-shows: the client gets their money back. */
  readonly refunded: number;
  readonly cancelled: number;
  readonly pending: number;
}

export interface HistorySession {
  readonly id: string;
  readonly start: Date;
  readonly end: Date;
  readonly client: Client;
  /** Null if it never had one. */
  readonly aapta: AaptaRef | null;
  readonly outcome: Outcome;
  readonly refunded: boolean;
  /** "What they expected". */
  readonly notes: string | null;
}

export interface HistoryMonth {
  readonly month: MonthKey;
  /** The months History offers, newest first. */
  readonly months: readonly MonthKey[];
  readonly summary: HistorySummary;
  /** Newest first. */
  readonly sessions: readonly HistorySession[];
  /** Older months still kept because nobody exported them; usually empty. */
  readonly olderMonthsNotExported: readonly MonthKey[];
}

/** The CSV of last month, and what the export cleared away. */
export interface HistoryExport {
  readonly file: Blob;
  readonly filename: string;
  readonly deletedMonths: readonly MonthKey[];
  readonly notExportedMonths: readonly MonthKey[];
}
