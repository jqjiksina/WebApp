import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 1), // 单用户测试，避免超过会话限制
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<10000'],  // 总响应时间
    http_req_waiting: ['p(95)<2000'],   // 首包响应延迟（TTFB - Time To First Byte）
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://222.20.98.159:5180';
const USERNAME = __ENV.USERNAME || 'Admin';
const PASSWORD = __ENV.PASSWORD || 'jcdl123@hust';

// WebRTC SDP Offer 模拟数据
const mockSDPOffer = {
  sdp: `v=0
o=- 1234567890 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=extmap-allow-mixed
a=msid-semantic: WMS
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:test
a=ice-pwd:test123456789012345678901234567890
a=ice-options:trickle
a=fingerprint:sha-256 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF
a=setup:actpass
a=mid:0
a=recvonly
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;useinbandfec=1
m=video 9 UDP/TLS/RTP/SAVPF 96
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:test
a=ice-pwd:test123456789012345678901234567890
a=ice-options:trickle
a=fingerprint:sha-256 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF
a=setup:actpass
a=mid:1
a=recvonly
a=rtcp-mux
a=rtpmap:96 VP8/90000
a=fmtp:96 max-fr=30;max-fs=8192`,
  type: 'offer'
};

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
  
  // 测试 WebRTC offer 接口
  const offerRes = http.post(
    `${BASE_URL}/digitalperson/offer`,
    JSON.stringify(mockSDPOffer),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: '30s'
    }
  );
  
  check(offerRes, {
    'offer status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'has sessionid when 200': (r) => r.status !== 200 || !!r.json('sessionid'),
    'has sdp answer when 200': (r) => r.status !== 200 || !!r.json('sdp'),
    'has type answer when 200': (r) => r.status !== 200 || r.json('type') === 'answer',
    'session limit message when 429': (r) => r.status !== 429 || r.json('msg').includes('最大会话数限制'),
  });
  
  if (offerRes.status === 200) {
    const sessionId = offerRes.json('sessionid');
    console.log(`WebRTC offer success, sessionid: ${sessionId}`);
    
    // 模拟WebRTC连接建立后的短暂使用
    sleep(2);
    
    // 清理WebRTC连接 - 模拟前端cleanupWebRTC函数
    console.log(`WebRTC connection ${sessionId} established, simulating connection cleanup...`);
    
    // 模拟WebRTC连接关闭过程（参考前端cleanupWebRTC函数）：
    // 1. 关闭PeerConnection: pc.close()
    // 2. 清理本地流: stream.getTracks().forEach(track => track.stop())
    // 3. 重置连接状态: peerConnection = null
    // 4. 清理会话ID: digitalPersonSessionId = null
    
    // 模拟调用WebRTC关闭API（如果后端提供）
    try {
      const closeRes = http.post(
        `${BASE_URL}/digitalperson/close`,
        JSON.stringify({ sessionid: sessionId }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: '10s'
        }
      );
      
      if (closeRes.status === 200) {
        console.log(`WebRTC connection ${sessionId} closed successfully via API`);
      } else {
        console.log(`WebRTC connection ${sessionId} closed locally (API not available)`);
      }
    } catch (error) {
      // 如果后端没有提供关闭API，则模拟本地关闭
      console.log(`WebRTC connection ${sessionId} closed locally: ${error.message}`);
    }
  } else if (offerRes.status === 429) {
    console.log(`WebRTC offer limited: ${offerRes.json('msg')}`);
  } else {
    console.error('WebRTC offer failed:', offerRes.status, offerRes.body);
  }
  
  sleep(3); // 增加间隔，确保会话完全清理
}