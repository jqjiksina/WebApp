const { test, expect } = require('@playwright/test');

test.describe('AI系统综合性能测试套件', () => {
  test('运行所有性能测试并生成综合报告', async ({ page }) => {
    // 设置超时时间
    test.setTimeout(300000); // 5分钟
    
    console.log('=== AI系统综合性能测试开始 ===');
    
    const allResults = {
      resumeAnalysis: [],
      interview: [],
      webrtc: []
    };
    
    // 访问登录页面
    await page.goto('http://222.20.98.159:5180/login');
    await page.waitForLoadState('networkidle');
    
    // 登录
    await page.fill('input[placeholder="用户名"]', 'Admin');
    await page.fill('input[placeholder="密码"]', 'jcdl123@hust');
    await page.click('button:has-text("登录")');
    
    // 等待登录完成 - 登录后跳转到首页
    await page.waitForURL('**/');
    await page.waitForLoadState('networkidle');
    console.log('登录成功，进入系统首页');
    
    // 1. 简历分析性能测试
    console.log('\n=== 1. 简历分析性能测试 ===');
    // 点击职业发展菜单展开
    await page.click('text=职业发展');
    await page.waitForTimeout(1000);
    // 点击简历修改
    await page.click('text=简历修改');
    await page.waitForLoadState('networkidle');
    console.log('进入简历分析页面');
    
    // 上传简历内容 - 直接通过聊天输入框发送简历内容
    const resumeContent = `姓名：张三
性别：男
年龄：25岁
学历：本科
专业：计算机科学与技术
工作经验：3年
技能：Java, Python, JavaScript, React, Vue.js`;
    
    // 找到聊天输入框并发送简历内容
    const chatInput = page.locator('textarea[placeholder="请输入您的问题..."]');
    await chatInput.waitFor({ state: 'visible', timeout: 10000 });
    await chatInput.fill(resumeContent);
    
    // 点击发送按钮
    await page.click('button:has-text("发送")');
    console.log('简历内容已发送，等待AI回复...');

    await page.waitForTimeout(3000);
    
    // 等待流式传输完成（输入框不再被禁用）
    await page.waitForFunction(() => {
      const input = document.querySelector('textarea[placeholder="请输入您的问题..."]');
      return input && !input.disabled;
    }, { timeout: 30000 });
    console.log('AI回复完成，输入框重新可用');
    
    // 测试简历分析关键词
    const resumeKeywords = ['简历提问', '简历回答'];
    for (const keyword of resumeKeywords) {
      // 找到聊天输入框
      const chatInput = page.locator('textarea[placeholder="请输入您的问题..."]');
      await chatInput.waitFor({ state: 'visible', timeout: 10000 });
      await chatInput.clear();
      await chatInput.fill(keyword);
      
      const startTime = Date.now();
      // 点击发送按钮
      await page.click('button:has-text("发送")');
      
      // 等待AI回复完成（输入框不再被禁用）
      await page.waitForFunction(() => {
        const input = document.querySelector('textarea[placeholder="请输入您的问题..."]');
        return input && !input.disabled;
      }, { timeout: 30000 });
      const firstMessageTime = Date.now();
      const delay = firstMessageTime - startTime;
      
      allResults.resumeAnalysis.push({
        keyword,
        delay,
        timestamp: new Date().toISOString()
      });
      
      console.log(`简历分析 - ${keyword}: ${delay}ms`);
    }
    
    // 2. AI面试性能测试
    console.log('\n=== 2. AI面试性能测试 ===');
    await page.click('text=Ai面试');
    await page.waitForLoadState('networkidle');
    console.log('进入AI面试页面');
    
    const interviewQuestions = [
      '请介绍一下你的技术背景',
      '你熟悉哪些编程语言？',
      'Please introduce yourself'
    ];
    
    for (const question of interviewQuestions) {
      // 找到聊天输入框
      const chatInput = page.locator('textarea[placeholder="请输入您的问题..."]');
      await chatInput.waitFor({ state: 'visible', timeout: 10000 });
      await chatInput.clear();
      await chatInput.fill(question);
      
      const startTime = Date.now();
      // 点击发送按钮
      await page.click('button:has-text("发送")');
      
      // 等待AI回复完成（输入框不再被禁用）
      await page.waitForFunction(() => {
        const input = document.querySelector('textarea[placeholder="请输入您的问题..."]');
        return input && !input.disabled;
      }, { timeout: 30000 });
      const firstMessageTime = Date.now();
      const delay = firstMessageTime - startTime;
      
      allResults.interview.push({
        question,
        delay,
        timestamp: new Date().toISOString()
      });
      
      console.log(`AI面试 - ${question}: ${delay}ms`);
      console.log(`等待输入框重新可用后继续下一个测试...`);
    }
    
    // 3. 数字人WebRTC连接测试
    console.log('\n=== 3. 数字人WebRTC连接测试 ===');
    // 直接跳转到数字人页面
    await page.goto('http://222.20.98.159:5180/analysis/interview');
    await page.waitForLoadState('networkidle');
    console.log('进入数字人页面');
    
    // 测试WebRTC连接建立
    const startButton = page.locator('button:has-text("开始对话"), button:has-text("启动数字人")').first();
    await startButton.waitFor({ state: 'visible', timeout: 10000 });
    
    const connectionStartTime = Date.now();
    await startButton.click();
    
    await page.waitForSelector('video, [class*="video"], [class*="stream"]', { timeout: 30000 });
    const connectionEstablishedTime = Date.now();
    const connectionDelay = connectionEstablishedTime - connectionStartTime;
    
    allResults.webrtc.push({
      type: 'connection',
      delay: connectionDelay,
      timestamp: new Date().toISOString()
    });
    
    console.log(`WebRTC连接建立: ${connectionDelay}ms`);
    
    // 测试连接关闭
    const closeButton = page.locator('button:has-text("结束对话"), button:has-text("关闭连接")').first();
    if (await closeButton.isVisible()) {
      const closeStartTime = Date.now();
      await closeButton.click();
      
      await page.waitForSelector('video, [class*="video"], [class*="stream"]', { state: 'hidden', timeout: 10000 });
      const connectionClosedTime = Date.now();
      const closeDelay = connectionClosedTime - closeStartTime;
      
      allResults.webrtc.push({
        type: 'disconnection',
        delay: closeDelay,
        timestamp: new Date().toISOString()
      });
      
      console.log(`WebRTC连接关闭: ${closeDelay}ms`);
    }
    
    // 生成综合性能报告
    console.log('\n=== 综合性能测试报告 ===');
    
    // 简历分析性能统计
    const resumeAvgDelay = allResults.resumeAnalysis.reduce((sum, r) => sum + r.delay, 0) / allResults.resumeAnalysis.length;
    const resumeMaxDelay = Math.max(...allResults.resumeAnalysis.map(r => r.delay));
    const resumeMinDelay = Math.min(...allResults.resumeAnalysis.map(r => r.delay));
    
    console.log(`\n简历分析性能:`);
    console.log(`  平均延迟: ${resumeAvgDelay.toFixed(2)}ms`);
    console.log(`  最大延迟: ${resumeMaxDelay}ms`);
    console.log(`  最小延迟: ${resumeMinDelay}ms`);
    console.log(`  测试次数: ${allResults.resumeAnalysis.length}`);
    
    // AI面试性能统计
    const interviewAvgDelay = allResults.interview.reduce((sum, r) => sum + r.delay, 0) / allResults.interview.length;
    const interviewMaxDelay = Math.max(...allResults.interview.map(r => r.delay));
    const interviewMinDelay = Math.min(...allResults.interview.map(r => r.delay));
    
    console.log(`\nAI面试性能:`);
    console.log(`  平均延迟: ${interviewAvgDelay.toFixed(2)}ms`);
    console.log(`  最大延迟: ${interviewMaxDelay}ms`);
    console.log(`  最小延迟: ${interviewMinDelay}ms`);
    console.log(`  测试次数: ${allResults.interview.length}`);
    
    // WebRTC连接性能统计
    const webrtcConnection = allResults.webrtc.find(r => r.type === 'connection');
    const webrtcDisconnection = allResults.webrtc.find(r => r.type === 'disconnection');
    
    console.log(`\nWebRTC连接性能:`);
    if (webrtcConnection) {
      console.log(`  连接建立时间: ${webrtcConnection.delay}ms`);
    }
    if (webrtcDisconnection) {
      console.log(`  连接关闭时间: ${webrtcDisconnection.delay}ms`);
    }
    
    // 整体性能评估
    const overallAvgDelay = (resumeAvgDelay + interviewAvgDelay) / 2;
    
    console.log(`\n整体性能评估:`);
    console.log(`  整体平均延迟: ${overallAvgDelay.toFixed(2)}ms`);
    console.log(`  性能等级: ${overallAvgDelay < 3000 ? '优秀' : overallAvgDelay < 5000 ? '良好' : overallAvgDelay < 8000 ? '一般' : '需要优化'}`);
    
    // 验证性能指标
    expect(allResults.resumeAnalysis.length).toBeGreaterThan(0);
    expect(allResults.interview.length).toBeGreaterThan(0);
    expect(allResults.webrtc.length).toBeGreaterThan(0);
    
    // 性能断言
    expect(resumeAvgDelay).toBeLessThan(8000);
    expect(interviewAvgDelay).toBeLessThan(10000);
    if (webrtcConnection) {
      expect(webrtcConnection.delay).toBeLessThan(10000);
    }
    
    console.log('\n=== 性能测试完成 ===');
  });
});
