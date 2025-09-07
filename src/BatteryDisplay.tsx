import { useEffect, useState } from 'react'
import { Zap, AlertTriangle, Github, Code, Sun, Moon, Monitor, Download } from 'lucide-react'

interface BatteryInfo {
  level: number
  charging: boolean
  chargingTime?: number
  dischargingTime?: number
}

const BatteryIcon = ({ level, charging, isDark = false }: { level: number; charging: boolean; isDark?: boolean }) => {
  const getBatteryColor = () => {
    if (charging) return isDark ? '#10b981' : '#10b981' // green-500
    if (level > 50) return isDark ? '#60a5fa' : '#3b82f6' // blue-400/500
    if (level > 20) return isDark ? '#fbbf24' : '#f59e0b' // yellow-400/500
    return isDark ? '#f87171' : '#ef4444' // red-400/500
  }

  const batteryWidth = 80
  const batteryHeight = 40
  const batteryRadius = 4
  const terminalWidth = 4
  const terminalHeight = 16
  const fillWidth = (batteryWidth - 6) * (level / 100)

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={batteryWidth + terminalWidth + 8}
        height={batteryHeight + 8}
        viewBox={`0 0 ${batteryWidth + terminalWidth + 8} ${batteryHeight + 8}`}
        className="drop-shadow-lg"
      >
        {/* 电池主体 */}
        <rect
          x="4"
          y="4"
          width={batteryWidth}
          height={batteryHeight}
          rx={batteryRadius}
          ry={batteryRadius}
          fill="none"
          stroke={getBatteryColor()}
          strokeWidth="3"
        />
        
        {/* 电池正极 */}
        <rect
          x={batteryWidth + 4}
          y={(batteryHeight - terminalHeight) / 2 + 4}
          width={terminalWidth}
          height={terminalHeight}
          rx="2"
          ry="2"
          fill={getBatteryColor()}
        />
        
        {/* 电池电量填充 */}
        <rect
          x="6"
          y="6"
          width={fillWidth}
          height={batteryHeight - 4}
          rx={batteryRadius - 1}
          ry={batteryRadius - 1}
          fill={getBatteryColor()}
          className={charging ? 'animate-pulse' : ''}
        />
        
        {/* 充电时的闪电动画 */}
        {charging && (
          <>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path
              d={`M${batteryWidth/2 - 4},${batteryHeight/2 - 8} L${batteryWidth/2 + 2},${batteryHeight/2} L${batteryWidth/2 - 2},${batteryHeight/2} L${batteryWidth/2 + 4},${batteryHeight/2 + 8} L${batteryWidth/2 - 2},${batteryHeight/2 + 2} L${batteryWidth/2 + 2},${batteryHeight/2 + 2} Z`}
              fill="white"
              filter="url(#glow)"
              className="animate-pulse"
            />
          </>
        )}
      </svg>
      
      {/* 充电指示器 */}
      {charging && (
        <div className="absolute -top-2 -right-2">
          <Zap className="w-6 h-6 text-green-500 animate-bounce" />
        </div>
      )}
    </div>
  )
}

const BatteryDisplay = () => {
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRawData, setShowRawData] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  // 获取实际应用的主题（当选择system时）
  const getActualTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  // 应用主题到文档
  useEffect(() => {
    const actualTheme = getActualTheme()
    const root = document.documentElement
    
    if (actualTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // 强制重新渲染
    root.style.colorScheme = actualTheme
  }, [theme])

  // 监听系统主题变化
  useEffect(() => {
    if (theme !== 'system') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const root = document.documentElement
      const isDark = mediaQuery.matches
      
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      
      root.style.colorScheme = isDark ? 'dark' : 'light'
    }
    
    // 立即应用当前系统主题
    handleChange()
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // PWA 安装提示
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    const handleAppInstalled = () => {
      console.log('PWA 已安装')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`PWA 安装结果: ${outcome}`)
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        if ('getBattery' in navigator) {
          // @ts-ignore - getBattery is not in TypeScript's navigator type
          const battery = await navigator.getBattery()
          
          const updateBatteryInfo = () => {
            setBatteryInfo({
              level: Math.round(battery.level * 100),
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime,
            })
          }

          updateBatteryInfo()

          // 监听电池状态变化
          battery.addEventListener('chargingchange', updateBatteryInfo)
          battery.addEventListener('levelchange', updateBatteryInfo)
          battery.addEventListener('chargingtimechange', updateBatteryInfo)
          battery.addEventListener('dischargingtimechange', updateBatteryInfo)

          return () => {
            battery.removeEventListener('chargingchange', updateBatteryInfo)
            battery.removeEventListener('levelchange', updateBatteryInfo)
            battery.removeEventListener('chargingtimechange', updateBatteryInfo)
            battery.removeEventListener('dischargingtimechange', updateBatteryInfo)
          }
        } else {
          setError('Battery API is not supported in this browser')
        }
      } catch (err) {
        setError('Failed to get battery information')
      }
    }

    getBatteryInfo()
  }, [])

  const getBatteryStatusColor = (level: number, charging: boolean) => {
    if (charging) return 'text-green-600'
    if (level > 50) return 'text-blue-600'
    if (level > 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBatteryBarColor = (level: number, charging: boolean) => {
    if (charging) return 'bg-gradient-to-r from-green-400 via-green-500 to-green-600'
    if (level > 50) return 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'
    if (level > 20) return 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600'
    return 'bg-gradient-to-r from-red-400 via-red-500 to-red-600'
  }

  const formatTime = (seconds: number | undefined) => {
    if (seconds === undefined || seconds === Infinity || !seconds) return null
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center max-w-md border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">错误</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!batteryInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">正在获取电池信息...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 p-4">
      {/* PWA 安装提示 - 底部优雅提示 */}
      {showInstallPrompt && (
        <div className="fixed bottom-6 left-6 right-6 z-40 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-4 max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
                  安装到桌面
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  获得更好的使用体验
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  安装
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="w-6 h-6 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 顶部工具栏 */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        {/* 主题切换按钮 */}
        <div className="flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-1 shadow-lg">
          <button
            onClick={() => setTheme('light')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-yellow-100 text-yellow-800 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="亮色模式"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-gray-800 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="暗色模式"
          >
            <Moon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              theme === 'system'
                ? 'bg-blue-100 text-blue-800 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="跟随系统"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        {/* GitHub Link */}
        <a
          href="https://github.com/alterem/batteryLevel"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
        >
          <Github className="w-5 h-5" />
          <span className="text-sm font-medium">GitHub</span>
        </a>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 w-full max-w-lg border border-white/20 dark:border-gray-700/20">
        <div className="text-center">
          {/* 电池图标 */}
          <div className="mb-8 flex justify-center">
            <BatteryIcon level={batteryInfo.level} charging={batteryInfo.charging} isDark={getActualTheme() === 'dark'} />
          </div>
          
          {/* 标题 */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent mb-4">
            电池状态
          </h1>
          
          {/* 电量百分比 */}
          <div className={`text-6xl font-bold mb-6 ${getBatteryStatusColor(batteryInfo.level, batteryInfo.charging)}`}>
            {batteryInfo.level}%
          </div>
          
          {/* 电量条 */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 mb-6 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${getBatteryBarColor(batteryInfo.level, batteryInfo.charging)}`}
              style={{ width: `${batteryInfo.level}%` }}
            >
              {batteryInfo.charging && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
              )}
            </div>
          </div>
          
          {/* 状态信息 */}
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer ${
              batteryInfo.charging 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }`}>
              {batteryInfo.charging && <Zap className="w-4 h-4" />}
              {batteryInfo.charging ? '正在充电' : '未充电'}
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {batteryInfo.charging && batteryInfo.chargingTime !== Infinity && (
                <p className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg">
                  充满还需: {formatTime(batteryInfo.chargingTime)}
                </p>
              )}
              
              {!batteryInfo.charging && batteryInfo.dischargingTime !== Infinity && (
                <p className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-lg">
                  剩余使用: {formatTime(batteryInfo.dischargingTime)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 原始数据展示区域 */}
      <div className="mt-6 w-full max-w-lg">
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mx-auto cursor-pointer"
        >
          <Code className="w-4 h-4" />
          <span className="text-sm font-medium">
            {showRawData ? '隐藏原始数据' : '显示原始数据'}
          </span>
        </button>

        {showRawData && (
          <div className="mt-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 font-mono text-sm shadow-xl border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="mb-2 font-semibold text-gray-700 dark:text-gray-300">
                Battery API 原始数据:
              </div>
              <div className="space-y-1">
                <div className="text-gray-800 dark:text-gray-200">
                  charging: <span className="text-orange-600 dark:text-orange-400">
                    {batteryInfo.charging ? 'true' : 'false'}
                  </span>
                </div>
                <div className="text-gray-800 dark:text-gray-200">
                  level: <span className="text-blue-600 dark:text-blue-400">
                    {batteryInfo.level / 100}
                  </span>
                </div>
                <div className="text-gray-800 dark:text-gray-200">
                  chargingTime: <span className="text-purple-600 dark:text-purple-400">
                    {batteryInfo.chargingTime === Infinity ? 'Infinity' : batteryInfo.chargingTime}
                  </span> seconds
                </div>
                <div className="text-gray-800 dark:text-gray-200">
                  dischargingTime: <span className="text-red-600 dark:text-red-400">
                    {batteryInfo.dischargingTime === Infinity ? 'Infinity' : batteryInfo.dischargingTime}
                  </span> seconds
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 底部提示 */}
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-6 text-center">
        实时监控您的设备电池状态
      </p>
    </div>
  )
}

export default BatteryDisplay