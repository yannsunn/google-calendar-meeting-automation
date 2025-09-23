// N8N APIのモックデータ
// 本番環境で環境変数が設定されていない場合に使用

export const mockWorkflows = [
  {
    id: 'mock-workflow-1',
    name: 'カレンダー同期ワークフロー',
    active: true,
    nodes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mock-workflow-2',
    name: '提案資料生成ワークフロー',
    active: false,
    nodes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const mockExecutions = [
  {
    id: 'mock-exec-1',
    workflowId: 'mock-workflow-1',
    status: 'success' as const,
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    stoppedAt: new Date(Date.now() - 3300000).toISOString(),
    data: {}
  },
  {
    id: 'mock-exec-2',
    workflowId: 'mock-workflow-1',
    status: 'success' as const,
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    stoppedAt: new Date(Date.now() - 7000000).toISOString(),
    data: {}
  }
]