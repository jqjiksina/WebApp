import request from '@/utils/request'

// 创建数字人会话
export function createSession() {
  return request.post('/api/digital-person/create-session')
}

// 关闭数字人会话
export function closeSession(sessionId: string) {
  return request.post('/api/digital-person/close-session', {
    session_id: sessionId
  })
}

// 通知视频录制完成
export function notifyVideoComplete(sessionId: string, videoPath: string) {
  return request.post('/api/digital-person/notify-video-complete', {
    session_id: sessionId,
    video_path: videoPath
  })
}

// 开始数字人录制
export function startVideoRecord(sessionId: string) {
  return request.post('/api/digital-person/start-video-record', {
    session_id: sessionId
  })
}

// 停止数字人录制

// 获取数字人录制的视频
