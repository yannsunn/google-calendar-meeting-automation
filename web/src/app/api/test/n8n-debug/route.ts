import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  const results: any = {
    env_check: {
      N8N_URL: process.env.N8N_URL || 'https://n8n.srv946785.hstgr.cloud',
      N8N_API_KEY: process.env.N8N_API_KEY ? 'Set' : 'Not set',
      API_KEY_LENGTH: process.env.N8N_API_KEY?.length || 0,
      API_KEY_TRIMMED_LENGTH: process.env.N8N_API_KEY?.trim().length || 0
    },
    direct_api_test: null,
    workflows: null,
    error: null
  }

  try {
    // 直接APIテスト
    const apiKey = process.env.N8N_API_KEY?.trim()
    const n8nUrl = process.env.N8N_URL || 'https://n8n.srv946785.hstgr.cloud'

    console.log('Testing N8N API with URL:', n8nUrl)
    console.log('API Key present:', !!apiKey)

    // まずシンプルなリクエストでテスト
    try {
      const testResponse = await axios.get(`${n8nUrl}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': apiKey || '',
        },
        params: {
          limit: 10
        }
      })

      results.direct_api_test = {
        success: true,
        status: testResponse.status,
        hasData: !!testResponse.data,
        dataType: typeof testResponse.data,
        workflowCount: testResponse.data?.data?.length || 0
      }

      // ワークフローデータを取得
      if (testResponse.data?.data) {
        results.workflows = testResponse.data.data.map((wf: any) => ({
          id: wf.id,
          name: wf.name,
          active: wf.active,
          createdAt: wf.createdAt,
          updatedAt: wf.updatedAt,
          tags: wf.tags
        }))
      }
    } catch (apiError: any) {
      results.direct_api_test = {
        success: false,
        error: apiError.message,
        response_status: apiError.response?.status,
        response_data: apiError.response?.data
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    results.error = {
      message: error.message,
      stack: error.stack
    }
    return NextResponse.json(results)
  }
}