export type ActiveClosing = {
  id: string;
  code: string;
  closingDate: string;
  packageCount: number;
  customerCount: number;
  checkedCount: number;
  pendingCount: number;
  progress: number;
};

export type DashboardSummary = {
  totalReceived: number;
  waitingClosing: number;
  meraukeApproved: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  activeClosings: ActiveClosing[];
  incomingTrend: { date: string; count: number }[];
};