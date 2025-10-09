import axios from 'axios';

const N8N_URL = process.env.N8N_URL || 'https://n8n.srv946785.hstgr.cloud';

// N8N APIの型定義
export interface N8NWorkflow {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface N8NExecution {
  id: string
  workflowId: string
  finished: boolean
  mode: string
  startedAt: string
  stoppedAt?: string
}

export type WorkflowData = Record<string, unknown>

// N8N APIクライアントを動的に作成
function createN8NClient() {
  // 環境変数から改行を除去
  const apiKey = process.env.N8N_API_KEY?.trim();

  return axios.create({
    baseURL: N8N_URL,
    headers: {
      'X-N8N-API-KEY': apiKey || '',
      'Content-Type': 'application/json',
    },
  });
}

// ワークフロー一覧を取得
export async function getWorkflows() {
  try {
    const n8nClient = createN8NClient();
    const response = await n8nClient.get('/api/v1/workflows');
    // N8N APIは data プロパティ内に配列を返す
    const workflows = response.data?.data || response.data;
    return Array.isArray(workflows) ? workflows : [];
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    // エラー時は空配列を返す
    return [];
  }
}

// 特定のワークフローを取得
export async function getWorkflow(id: string) {
  try {
    const n8nClient = createN8NClient();
    const response = await n8nClient.get(`/api/v1/workflows/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch workflow ${id}:`, error);
    throw new Error(`Failed to fetch workflow ${id}`);
  }
}

// ワークフローを実行
export async function executeWorkflow(id: string, data?: WorkflowData) {
  try {
    const n8nClient = createN8NClient();
    const response = await n8nClient.post(`/api/v1/workflows/${id}/execute`, {
      data,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Failed to execute workflow ${id}:`, error);
    throw new Error(`Failed to execute workflow ${id}`);
  }
}

// 実行履歴を取得
export async function getExecutions(workflowId?: string) {
  try {
    const n8nClient = createN8NClient();
    const params = workflowId ? { workflowId } : {};
    const response = await n8nClient.get('/api/v1/executions', { params });
    // N8N APIは data プロパティ内に配列を返す
    const executions = response.data?.data || response.data;
    return Array.isArray(executions) ? executions : [];
  } catch (error) {
    console.error('Failed to fetch executions:', error);
    // エラー時は空配列を返す
    return [];
  }
}

// 特定の実行を取得
export async function getExecution(id: string) {
  try {
    const n8nClient = createN8NClient();
    const response = await n8nClient.get(`/api/v1/executions/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch execution ${id}:`, error);
    throw new Error(`Failed to fetch execution ${id}`);
  }
}

// ワークフローをアクティブ/非アクティブに設定
export async function toggleWorkflow(id: string, active: boolean) {
  try {
    const n8nClient = createN8NClient();
    const response = await n8nClient.patch(`/api/v1/workflows/${id}`, {
      active,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Failed to toggle workflow ${id}:`, error);
    throw new Error(`Failed to toggle workflow ${id}`);
  }
}

// Webhook経由でワークフローをトリガー
export async function triggerWebhook(webhookPath: string, data: WorkflowData) {
  try {
    const response = await axios.post(
      `${N8N_URL}/webhook/${webhookPath}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to trigger webhook ${webhookPath}:`, error);
    throw new Error(`Failed to trigger webhook ${webhookPath}`);
  }
}

// N8N APIの接続テスト
export async function testConnection() {
  try {
    const n8nClient = createN8NClient();
    const response = await n8nClient.get('/api/v1/workflows?limit=1');
    return { connected: true, message: 'N8N API connection successful' };
  } catch (error) {
    console.error('N8N API connection test failed:', error);
    return { connected: false, message: 'N8N API connection failed' };
  }
}