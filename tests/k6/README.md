# k6 性能测试脚本

## 测试用例说明

### 1. 用户认证测试 (k6-auth.js)
- **功能**: 测试用户登录接口
- **并发数**: 1 VU
- **测试时长**: 30秒
- **阈值**: p95<500ms, 错误率<1%

### 2. 数字人WebRTC连接测试 (k6-digital-person-offer.js)
- **功能**: 测试数字人WebRTC连接建立和清理
- **并发数**: 1 VU (避免超过会话限制)
- **测试时长**: 30秒
- **特点**: 
  - 正确清理WebRTC连接
  - 模拟前端cleanupWebRTC函数
  - 避免会话泄漏

### 3. 数字人会话限制测试 (k6-digital-person-session-limit.js)
- **功能**: 测试数字人会话限制机制
- **并发数**: 8 VU (超过默认6个会话限制)
- **测试时长**: 20秒
- **特点**: 验证会话限制是否正常工作

### 4. 简历对话测试 (k6-resume-chat.js)
- **功能**: 测试简历分析对话功能
- **并发数**: 5 VU
- **测试时长**: 60秒
- **特点**: 
  - 先创建新会话，再使用
  - 避免一直创建新session
  - 正确清理会话资源

### 5. 面试对话测试 (k6-interview-chat.js)
- **功能**: 测试AI面试对话功能
- **并发数**: 5 VU
- **测试时长**: 60秒
- **特点**: 
  - 先创建新会话，再使用
  - 避免一直创建新session
  - 正确清理会话资源

## 运行命令

### 基础测试
```bash
# 用户认证测试
BASE_URL=http://222.20.98.159:5180 USERNAME=Admin PASSWORD='jcdl123@hust' k6 run k6-auth.js

# 数字人WebRTC测试（单用户）
BASE_URL=http://222.20.98.159:5180 USERNAME=Admin PASSWORD='jcdl123@hust' VUS=1 DURATION=30s k6 run k6-digital-person-offer.js

# 数字人会话限制测试
BASE_URL=http://222.20.98.159:5180 USERNAME=Admin PASSWORD='jcdl123@hust' VUS=8 DURATION=20s k6 run k6-digital-person-session-limit.js

# 简历对话测试
BASE_URL=http://222.20.98.159:5180 USERNAME=Admin PASSWORD='jcdl123@hust' VUS=5 DURATION=60s k6 run k6-resume-chat.js

# 面试对话测试
BASE_URL=http://222.20.98.159:5180 USERNAME=Admin PASSWORD='jcdl123@hust' VUS=5 DURATION=60s k6 run k6-interview-chat.js
```

### 完整测试套件
```bash
# 运行所有测试
for test in k6-auth.js k6-digital-person-offer.js k6-resume-chat.js k6-interview-chat.js; do
  echo "Running $test..."
  BASE_URL=http://222.20.98.159:5180 USERNAME=Admin PASSWORD='jcdl123@hust' k6 run $test
  echo "Completed $test"
  sleep 5
done
```

## 测试重点

### 数字人WebRTC测试
- ✅ 不超过最大会话数限制
- ✅ 正确清理WebRTC连接（关闭PeerConnection，清理本地流）
- ✅ 模拟前端cleanupWebRTC函数
- ✅ 避免会话泄漏

### 会话管理测试
- ✅ 先创建新会话，再使用
- ✅ 避免一直创建新session
- ✅ 正确清理会话资源
- ✅ 测试会话限制机制

### 性能指标
- **响应时间**: p95<10s (数字人), p95<5s (其他)
- **错误率**: <10% (考虑会话限制)
- **吞吐量**: 根据功能特点设定合理阈值

## 注意事项

1. **数字人测试**: 严格控制并发数，避免超过会话限制
2. **WebRTC连接清理**: 应该关闭PeerConnection和清理本地流，而不是调用后端API
3. **会话管理**: 先创建会话再使用，避免资源浪费
4. **资源清理**: 测试结束后正确清理所有资源
5. **错误处理**: 合理设置错误率阈值，考虑系统限制
