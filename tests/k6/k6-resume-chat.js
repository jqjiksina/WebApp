import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_waiting: ['p(95)<2000'],   // 首包响应延迟（TTFB - Time To First Byte）
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://222.20.98.159:5180';
const USERNAME = __ENV.USERNAME || 'Admin';
const PASSWORD = __ENV.PASSWORD || 'jcdl123@hust';

export function setup() {
  // 登录获取 token
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    { username: USERNAME, password: PASSWORD },
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: '30s' }
  );
  
  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'has token': (r) => !!r.json('access_token'),
  });
  
  const token = loginRes.json('access_token');
  return { token };
}

export default function (data) {
  const token = data.token;
  let sessionId = null;
  
  try {
    // 1. 先创建新会话，避免一直创建新session
    const newSessionRes = http.get(
      `${BASE_URL}/api/resume/newSession`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: '10s'
      }
    );
    
    check(newSessionRes, {
      'new session status 200': (r) => r.status === 200,
      'has session_id': (r) => !!r.json('session_id'),
    });
    
    if (newSessionRes.status === 200) {
      sessionId = newSessionRes.json('session_id');
      console.log(`Created new resume session: ${sessionId}`);
    } else {
      console.error('Failed to create new session:', newSessionRes.status);
      return;
    }
    
    // 2. 使用已创建的会话进行对话（SSE流式响应）
    const chatRes = http.post(
      `${BASE_URL}/api/resume/chat`,
      JSON.stringify({
        content: '请帮我分析一下我的简历，有什么需要改进的地方吗？',
        session_id: sessionId
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        timeout: '60s'  // SSE流式响应需要更长的超时时间
      }
    );
    
    check(chatRes, {
      'chat status 200': (r) => r.status === 200,
      'has SSE content type': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('text/event-stream'),
      'has response content': (r) => !!r.body,
    });
    
    if (chatRes.status === 200) {
      console.log(`Resume chat SSE success for session: ${sessionId}`);
      // 处理SSE流式响应
      const sseData = chatRes.body;
      if (sseData && sseData.includes('data:')) {
        console.log(`Received SSE stream data for session: ${sessionId}`);
        // 模拟处理SSE数据
        const lines = sseData.split('\n');
        let dataCount = 0;
        for (const line of lines) {
          if (line.startsWith('data:')) {
            dataCount++;
          }
        }
        console.log(`Processed ${dataCount} SSE data chunks for session: ${sessionId}`);
      }
    } else {
      console.error('Resume chat failed:', chatRes.status, chatRes.body);
    }
    
    // 3. 模拟短暂使用后清理会话
    sleep(2);
    
    // 4. 删除会话（清理资源）
    const deleteRes = http.post(
      `${BASE_URL}/api/resume/delete_session`,
      JSON.stringify({ session_ids: [sessionId] }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: '10s'
      }
    );
    
    if (deleteRes.status === 200) {
      console.log(`Resume session ${sessionId} cleaned up successfully`);
    } else {
      console.log(`Resume session ${sessionId} cleanup failed: ${deleteRes.status}`);
    }
    
  } catch (error) {
    console.error('Resume chat test error:', error);
  }
  
  sleep(1);
}
