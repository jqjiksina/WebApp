import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || '2m',
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
    
    // 2. 先上传简历内容
    const uploadRes = http.post(
      `${BASE_URL}/api/resume/upload`,
      JSON.stringify({
        resumeContent: `姓名：张三
性别：男
年龄：25岁
学历：本科
专业：计算机科学与技术
工作经验：3年
技能：Java, Python, JavaScript, React, Vue.js
项目经验：
1. 电商系统开发 - 负责后端API设计和数据库优化
2. 移动端应用开发 - 使用React Native开发跨平台应用
3. 数据分析平台 - 使用Python进行数据挖掘和可视化
自我评价：具备扎实的编程基础，熟悉前后端开发，有良好的团队协作能力。`
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: '30s'
      }
    );
    
    check(uploadRes, {
      'upload status 200': (r) => r.status === 200
    });
    
    if (uploadRes.status === 200) {
      console.log(`Resume uploaded successfully for session: ${sessionId}`);
    } else {
      console.error('Resume upload failed:', uploadRes.status, uploadRes.body);
      return;
    }
    
    // 3. 发送"已上传简历"消息
    const initialChatRes = http.post(
      `${BASE_URL}/api/resume/chat`,
      JSON.stringify({
        content: '已上传简历',
        session_id: sessionId
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        timeout: '60s'
      }
    );
    
    check(initialChatRes, {
      'initial chat status 200': (r) => r.status === 200,
      'has SSE content type': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('text/event-stream'),
      'has response content': (r) => !!r.body,
    });
    
    if (initialChatRes.status === 200) {
      console.log(`Initial resume chat SSE success for session: ${sessionId}`);
      // 处理SSE流式响应
      const sseData = initialChatRes.body;
      if (sseData && sseData.includes('data:')) {
        console.log(`Received initial SSE stream data for session: ${sessionId}`);
        const lines = sseData.split('\n');
        let dataCount = 0;
        for (const line of lines) {
          if (line.startsWith('data:')) {
            dataCount++;
          }
        }
        console.log(`Processed ${dataCount} initial SSE data chunks for session: ${sessionId}`);
      }
    } else {
      console.error('Initial resume chat failed:', initialChatRes.status, initialChatRes.body);
      return;
    }
    
    // 4. 测试各个关键词流程
    const keywords = [
      '简历提问',
      '简历回答',
      '英语提问', 
      '英语回答',
      '数学提问',
      '数学回答',
      '场景提问',
      '场景回答',
      '前沿提问',
      '前沿回答',
      '课程提问',
      '课程回答'
    ];
    
    // 随机选择3个关键词进行测试
    const selectedKeywords = keywords;
    
    for (const keyword of selectedKeywords) {
      console.log(`Testing keyword: ${keyword}`);
      
      const keywordChatRes = http.post(
        `${BASE_URL}/api/resume/chat`,
        JSON.stringify({
          content: keyword,
          session_id: sessionId
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          },
          timeout: '60s'
        }
      );
      
      check(keywordChatRes, {
        [`${keyword} chat status 200`]: (r) => r.status === 200,
        [`${keyword} has SSE content type`]: (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('text/event-stream'),
        [`${keyword} has response content`]: (r) => !!r.body,
      });
      
      if (keywordChatRes.status === 200) {
        console.log(`Keyword ${keyword} chat SSE success for session: ${sessionId}`);
        const sseData = keywordChatRes.body;
        if (sseData && sseData.includes('data:')) {
          const lines = sseData.split('\n');
          let dataCount = 0;
          for (const line of lines) {
            if (line.startsWith('data:')) {
              dataCount++;
            }
          }
          console.log(`Processed ${dataCount} SSE data chunks for keyword ${keyword}`);
        }
      } else {
        console.error(`Keyword ${keyword} chat failed:`, keywordChatRes.status, keywordChatRes.body);
      }
      
      // 关键词之间稍作停顿
      sleep(1);
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
