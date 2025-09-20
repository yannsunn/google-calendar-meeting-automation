'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  PlayArrow,
  Stop,
  Refresh,
  CheckCircle,
  Error,
  Schedule,
  Info,
  History,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Workflow {
  id: string
  name: string
  active: boolean
  nodes: any[]
  createdAt: string
  updatedAt: string
}

interface Execution {
  id: string
  workflowId: string
  status: 'success' | 'error' | 'running' | 'waiting'
  startedAt: string
  stoppedAt?: string
  data?: any
}

export default function N8NWorkflowStatus() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false)

  useEffect(() => {
    fetchWorkflows()
    fetchExecutions()
    const interval = setInterval(() => {
      fetchExecutions()
    }, 10000) // 10秒ごとに実行状態を更新
    return () => clearInterval(interval)
  }, [])

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/n8n/workflows')
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch workflows')
      }
      const data = await response.json()
      setWorkflows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching workflows')
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/n8n/executions')
      if (!response.ok) {
        const data = await response.json()
        if (data.error === 'N8N_API_KEY is not configured') {
          setError('N8N APIキーが設定されていません。環境変数にN8N_API_KEYを設定してください。')
          return
        }
        throw new Error(data.error || 'Failed to fetch executions')
      }
      const data = await response.json()
      setExecutions(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching executions:', err)
    }
  }

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch('/api/n8n/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId }),
      })
      if (!response.ok) {
        throw new Error('Failed to execute workflow')
      }
      await fetchExecutions()
    } catch (err) {
      console.error('Error executing workflow:', err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />
      case 'error':
        return <Error color="error" />
      case 'running':
        return <CircularProgress size={20} />
      case 'waiting':
        return <Schedule color="action" />
      default:
        return <Info color="action" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success'
      case 'error':
        return 'error'
      case 'running':
        return 'primary'
      case 'waiting':
        return 'default'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error && error.includes('N8N_API_KEY')) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            <Typography variant="h6" gutterBottom>
              N8N API連携の設定が必要です
            </Typography>
            <Typography variant="body2" paragraph>
              {error}
            </Typography>
            <Typography variant="body2">
              設定方法：
            </Typography>
            <ol>
              <li>N8N管理画面にログイン: https://n8n.srv946785.hstgr.cloud</li>
              <li>Settings → API Settings でAPIキーを生成</li>
              <li>Vercel Dashboard → Environment Variables にN8N_API_KEYを追加</li>
              <li>アプリケーションを再デプロイ</li>
            </ol>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            N8N ワークフロー状態
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchWorkflows()
              fetchExecutions()
            }}
          >
            更新
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          ワークフロー一覧
        </Typography>
        <List>
          {workflows.map((workflow) => (
            <ListItem key={workflow.id}>
              <ListItemText
                primary={workflow.name}
                secondary={
                  <Box display="flex" gap={1} alignItems="center">
                    <Chip
                      label={workflow.active ? 'アクティブ' : '非アクティブ'}
                      color={workflow.active ? 'success' : 'default'}
                      size="small"
                    />
                    <Typography variant="caption">
                      最終更新: {format(new Date(workflow.updatedAt), 'MM/dd HH:mm', { locale: ja })}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="実行">
                  <IconButton
                    edge="end"
                    onClick={() => executeWorkflow(workflow.id)}
                    disabled={!workflow.active}
                  >
                    <PlayArrow />
                  </IconButton>
                </Tooltip>
                <Tooltip title="履歴">
                  <IconButton
                    edge="end"
                    onClick={() => {
                      setSelectedWorkflow(workflow.id)
                      setExecutionDialogOpen(true)
                    }}
                  >
                    <History />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          最近の実行
        </Typography>
        <List>
          {executions.slice(0, 5).map((execution) => (
            <ListItem key={execution.id}>
              <ListItemText
                primary={
                  <Box display="flex" gap={1} alignItems="center">
                    {getStatusIcon(execution.status)}
                    <Typography>
                      Workflow ID: {execution.workflowId.substring(0, 8)}...
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Chip
                      label={execution.status}
                      color={getStatusColor(execution.status) as any}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="caption">
                      開始: {format(new Date(execution.startedAt), 'MM/dd HH:mm:ss', { locale: ja })}
                      {execution.stoppedAt && (
                        <> | 終了: {format(new Date(execution.stoppedAt), 'HH:mm:ss', { locale: ja })}</>
                      )}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        <Dialog
          open={executionDialogOpen}
          onClose={() => setExecutionDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            ワークフロー実行履歴
          </DialogTitle>
          <DialogContent>
            <List>
              {executions
                .filter(e => selectedWorkflow ? e.workflowId === selectedWorkflow : true)
                .map((execution) => (
                  <ListItem key={execution.id}>
                    <ListItemText
                      primary={`実行ID: ${execution.id}`}
                      secondary={
                        <Box>
                          <Chip
                            label={execution.status}
                            color={getStatusColor(execution.status) as any}
                            size="small"
                          />
                          <Typography variant="caption" display="block">
                            {format(new Date(execution.startedAt), 'yyyy/MM/dd HH:mm:ss', { locale: ja })}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExecutionDialogOpen(false)}>
              閉じる
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}