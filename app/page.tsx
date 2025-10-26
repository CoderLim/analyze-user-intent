'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AnalysisResult {
  inputs: string[]
  response: {
    response: string
    usage?: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
  }
}

export default function Home() {
  const [keywords, setKeywords] = useState('')
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [batchSize, setBatchSize] = useState(100)
  const [processedKeywords, setProcessedKeywords] = useState<string[]>([])
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)
  const [keywordBatches, setKeywordBatches] = useState<string[][]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAutoProcessing, setIsAutoProcessing] = useState(false)
  const [autoProcessTimer, setAutoProcessTimer] = useState<NodeJS.Timeout | null>(null)
  const [hasResults, setHasResults] = useState(false)

  // 处理关键词：去重、过滤纯数字
  const processKeywords = (keywordList: string[]) => {
    // 去重
    const uniqueKeywords = Array.from(new Set(keywordList))
    
    // 过滤纯数字关键词
    const filteredKeywords = uniqueKeywords.filter(keyword => {
      // 检查是否为纯数字（包括小数）
      const isNumeric = /^\d+(\.\d+)?$/.test(keyword.trim())
      return !isNumeric && keyword.trim().length > 0
    })
    
    return filteredKeywords
  }

  // 分批处理关键词
  const createBatches = (keywordList: string[], size: number) => {
    const batches = []
    for (let i = 0; i < keywordList.length; i += size) {
      batches.push(keywordList.slice(i, i + size))
    }
    return batches
  }

  // 调用分析接口
  const analyzeKeywords = async (keywordBatch: string[]): Promise<AnalysisResult> => {
    const response = await fetch('https://analyze-user-intents-with-keywords.gengliming110.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: keywordBatch
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    // 接口返回的是数组，我们取第一个结果
    return data[0] || { 
      inputs: keywordBatch, 
      response: { 
        response: '分析失败' 
      } 
    }
  }

  // 初始化关键词处理
  const handleInitialize = () => {
    if (!keywords.trim()) {
      setError('Please enter keywords')
      return
    }

    setError('')
    setResults([])
    setProgress('')

    // 解析关键词
    const keywordList = keywords
      .split(/[,\n]/)
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0)

    if (keywordList.length === 0) {
      setError('Please enter valid keywords')
      return
    }

    // 处理关键词：去重、过滤纯数字
    const processed = processKeywords(keywordList)
    setProcessedKeywords(processed)

    if (processed.length === 0) {
      setError('No valid keywords after deduplication and filtering')
      return
    }

    // 创建批次
    const batches = createBatches(processed, batchSize)
    setKeywordBatches(batches)
    setCurrentBatchIndex(0)
    setIsInitialized(true)

    setProgress(`Processed ${keywordList.length} keywords, ${processed.length} valid keywords remaining after deduplication and filtering, divided into ${batches.length} batches.`)
  }

  // 处理当前批次
  const handleProcessCurrentBatch = async () => {
    if (currentBatchIndex >= keywordBatches.length) {
      setProgress('All batches completed!')
      return
    }

    setLoading(true)
    setError('')

    try {
      const currentBatch = keywordBatches[currentBatchIndex]
      setProgress(`Analyzing batch ${currentBatchIndex + 1}/${keywordBatches.length} keywords (${currentBatch.length} items)...`)
      
      const result = await analyzeKeywords(currentBatch)
      setResults(prev => [result, ...prev]) // 新结果放在前面
      setHasResults(true) // 有结果后切换到左右布局
      
      setCurrentBatchIndex(prev => prev + 1)
      
      if (currentBatchIndex + 1 >= keywordBatches.length) {
        setProgress(`Analysis completed! Processed ${processedKeywords.length} keywords in ${keywordBatches.length} batches.`)
      } else {
        setProgress(`Batch ${currentBatchIndex + 1} completed, click "Process next batch" to continue.`)
      }
    } catch (err) {
      setError(`Batch ${currentBatchIndex + 1} analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // 重置所有状态
  const handleReset = () => {
    setKeywords('')
    setResults([])
    setError('')
    setProgress('')
    setProcessedKeywords([])
    setCurrentBatchIndex(0)
    setKeywordBatches([])
    setIsInitialized(false)
    setHasResults(false)
  }

  // 合并所有结果
  const combinedMarkdown = results
    .map((result, index) => {
      // 由于新结果在前面，需要计算正确的批次号
      const batchNumber = results.length - index
      const header = results.length > 1 ? `## Batch ${batchNumber} Analysis Results\n\n` : ''
      return `${header}${result.response.response}\n\n---\n\n`
    })
    .join('')

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: '700', 
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Keyword Analysis Tool
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
          Intelligent user intent analysis and batch keyword processing
        </p>
      </div>
      
      {!isInitialized || !hasResults ? (
        <div className="input-section" style={{ marginBottom: '24px' }}>
          {!isInitialized ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                  Keyword Input
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Batch Size:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
                    style={{
                      width: '80px',
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      textAlign: 'center'
                    }}
                    disabled={isInitialized}
                  />
                </div>
              </div>
              
              <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                Please enter keywords to analyze, separated by commas or newlines. The system will automatically deduplicate and filter out pure numeric keywords.
              </p>
              
              <textarea
                className="textarea"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Please enter keywords, for example:&#10;artificial intelligence&#10;machine learning&#10;deep learning&#10;natural language processing&#10;123&#10;456"
                disabled={loading || isInitialized}
                style={{ minHeight: '150px' }}
              />
              
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  className="btn"
                  onClick={handleInitialize}
                  disabled={loading}
                  style={{ 
                    padding: '14px 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {loading ? (
                    <span className="loading">
                      <span className="spinner"></span>
                      Processing...
                    </span>
                  ) : (
                    '🚀 Start Analysis'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 状态信息 */}
              <div style={{ 
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '1px solid #0ea5e9',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(14, 165, 233, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: '#0ea5e9',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e' }}>
                    Valid Keywords: {processedKeywords.length.toLocaleString()}
                  </span>
                </div>
                <div style={{ 
                  background: '#0ea5e9', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'inline-block'
                }}>
                  {keywordBatches.length} batches
                </div>
              </div>
              
              {/* 进度信息 */}
              {progress && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{ 
                    width: '4px', 
                    height: '4px', 
                    borderRadius: '50%', 
                    background: '#3b82f6',
                    animation: 'pulse 1.5s infinite'
                  }}></div>
                  {progress}
                </div>
              )}

              {/* 错误信息 */}
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '14px' }}>⚠️</span>
                  {error}
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Batch Size:
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  disabled={true}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Keyword Input:
                </label>
                <textarea
                  className="textarea"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Please enter keywords..."
                  disabled={true}
                  style={{ minHeight: '120px', fontSize: '12px' }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  className="btn"
                  onClick={handleProcessCurrentBatch}
                  disabled={loading || currentBatchIndex >= keywordBatches.length}
                  style={{ 
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    boxShadow: currentBatchIndex >= keywordBatches.length ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {loading ? (
                    <span className="loading">
                      <span className="spinner"></span>
                      Analyzing...
                    </span>
                  ) : currentBatchIndex >= keywordBatches.length ? (
                    '✅ All Complete'
                  ) : (
                    `📊 Process Batch ${currentBatchIndex + 1}`
                  )}
                </button>
                <button
                  className="btn"
                  onClick={handleReset}
                  disabled={loading}
                  style={{ 
                    background: '#6b7280',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)'
                  }}
                >
                  🔄 Restart
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* 左侧控制面板 - 1/4 宽度 */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <div className="input-section" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                🎛️ 控制面板
              </h2>
              
              {/* 状态信息 */}
              <div style={{ 
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '1px solid #0ea5e9',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(14, 165, 233, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: '#0ea5e9',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e' }}>
                    Valid Keywords: {processedKeywords.length.toLocaleString()}
                  </span>
                </div>
                <div style={{ 
                  background: '#0ea5e9', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'inline-block'
                }}>
                  {keywordBatches.length} batches
                </div>
              </div>
              
              {/* 进度信息 */}
              {progress && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{ 
                    width: '4px', 
                    height: '4px', 
                    borderRadius: '50%', 
                    background: '#3b82f6',
                    animation: 'pulse 1.5s infinite'
                  }}></div>
                  {progress}
                </div>
              )}

              {/* 错误信息 */}
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '14px' }}>⚠️</span>
                  {error}
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Batch Size:
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  disabled={true}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Keyword Input:
                </label>
                <textarea
                  className="textarea"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Please enter keywords..."
                  disabled={true}
                  style={{ minHeight: '120px', fontSize: '12px' }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  className="btn"
                  onClick={handleProcessCurrentBatch}
                  disabled={loading || currentBatchIndex >= keywordBatches.length}
                  style={{ 
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    boxShadow: currentBatchIndex >= keywordBatches.length ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {loading ? (
                    <span className="loading">
                      <span className="spinner"></span>
                      Analyzing...
                    </span>
                  ) : currentBatchIndex >= keywordBatches.length ? (
                    '✅ All Complete'
                  ) : (
                    `📊 Process Batch ${currentBatchIndex + 1}`
                  )}
                </button>
                <button
                  className="btn"
                  onClick={handleReset}
                  disabled={loading}
                  style={{ 
                    background: '#6b7280',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)'
                  }}
                >
                  🔄 Restart
                </button>
              </div>
            </div>
          </div>
          
          {/* 右侧结果区域 - 3/4 宽度 */}
          <div style={{ flex: '3', minWidth: '600px' }}>
            {/* Analysis Results */}
            {results.length > 0 && (
              <div className="result-section" style={{ 
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: '1px solid #f1f5f9'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #f1f5f9'
                }}>
                  <h2 style={{ 
                    fontSize: '22px', 
                    fontWeight: '700', 
                    margin: 0,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    📊 Analysis Results
                  </h2>
                  <div style={{ 
                    background: '#f0f9ff',
                    color: '#0c4a6e',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    Processed {results.length} batches
                  </div>
                </div>
                <div className="markdown-content" style={{
                  lineHeight: '1.7',
                  color: '#374151',
                  fontSize: '15px'
                }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {combinedMarkdown}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
