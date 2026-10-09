/** One request row of the staff activity log (`GET /admin/user-activity/logs`). `username` is null for a guest. */
export interface ActivityLog {
  id: string;
  at: string;
  username: string | null;
  ip: string;
  path: string;
  method: string;
  statusCode: number;
  userAgent: string;
  referer: string;
}

export interface ActivitySession {
  id: string;
  ip: string;
  userAgent: string;
  deviceType: string;
  browser: string;
  os: string;
  createdAt: string;
  lastActivityAt: string;
}

export interface ActivityCount {
  value: string;
  count: number;
}

export interface ActivitySummary {
  username: string;
  total: number;
  /** One entry per UTC day of the window. */
  daily: { day: string; count: number }[];
  topIps: ActivityCount[];
  topPaths: ActivityCount[];
  /** The 50 most recent sessions. */
  sessions: ActivitySession[];
}

/** Visitors seen in the last `windowMinutes`; `users` is one page (50), most recently seen first. */
export interface LiveActivity {
  windowMinutes: number;
  authenticatedUsers: number;
  anonymousVisitors: number;
  bots: number;
  users: { user: { id: string; username: string }; lastSeenAt: string }[];
}
