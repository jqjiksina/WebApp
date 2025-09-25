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
    // 注意：面试会话通过answer接口创建，传入空的session_id
    const createSessionRes = http.post(
      `${BASE_URL}/api/interview/answer`,
      JSON.stringify({
        answer: '', // 空答案触发开场白
        session_id: null // 空session_id触发新会话创建
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: '30s'
      }
    );
    
    check(createSessionRes, {
      'create session status 200': (r) => r.status === 200,
      'has session_id': (r) => !!r.json('session_id'),
      'has message': (r) => !!r.json('message'),
    });
    
    if (createSessionRes.status === 200) {
      sessionId = createSessionRes.json('session_id');
      console.log(`Created new interview session: ${sessionId}`);
    } else {
      console.error('Failed to create new interview session:', createSessionRes.status);
      return;
    }
    
    // 2. 使用已创建的会话进行对话（SSE流式响应）
    const chatRes = http.post(
      `${BASE_URL}/api/interview/answer`,
      JSON.stringify({
        answer: '我是一名软件工程师，有3年的开发经验，熟悉Java和Python。',
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
      console.log(`Interview chat SSE success for session: ${sessionId}`);
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
      console.error('Interview chat failed:', chatRes.status, chatRes.body);
    }
    
    // 3. 模拟短暂使用后清理会话
    sleep(2);
    
    // 4. 删除会话（清理资源）
    const deleteRes = http.post(
      `${BASE_URL}/api/interview/delete_session`,
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
      console.log(`Interview session ${sessionId} cleaned up successfully`);
    } else {
      console.log(`Interview session ${sessionId} cleanup failed: ${deleteRes.status}`);
    }
    
  } catch (error) {
    console.error('Interview chat test error:', error);
  }
  
  sleep(1);
}
