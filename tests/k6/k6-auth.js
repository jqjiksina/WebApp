import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://222.20.98.159:5180';
const USERNAME = __ENV.USERNAME || 'Admin';
const PASSWORD = __ENV.PASSWORD || 'jcdl123@hust';

export default function () {
  // 测试登录接口
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    { username: USERNAME, password: PASSWORD },
    { 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
      timeout: '30s' 
    }
  );
  
  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'has token': (r) => !!r.json('access_token'),
    'has user info': (r) => !!r.json('user_info'),
  });
  
  if (loginRes.status === 200) {
    console.log('Login successful');
  } else {
    console.error('Login failed:', loginRes.status, loginRes.body);
  }
  
  sleep(1);
}
