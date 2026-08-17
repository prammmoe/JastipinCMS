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
  receivedToday: number;
  waitingClosing: number;
  waitingMerauke: number;
  meraukeCompletedToday: number;
  attentionCount: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  attention: { damaged: number; missing: number; hold: number };
  aging: {
    waitingClosingOverThreshold: number;
    waitingMeraukeOverThreshold: number;
  };
  activeClosings: ActiveClosing[];
  incomingTrend: { date: string; count: number }[];
};
