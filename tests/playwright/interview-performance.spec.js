const { test, expect } = require('@playwright/test');

test.describe('AI面试模块性能测试', () => {
  test('测试AI面试SSE流式响应性能', async ({ page }) => {
    // 设置超时时间
    test.setTimeout(180000);
    
    console.log('开始测试AI面试模块性能...');
    
    // 访问登录页面
    await page.goto('http://222.20.98.159:5180/login');
    await page.waitForLoadState('networkidle');
    
    // 登录
    await page.fill('input[placeholder="用户名"]', 'Admin');
    await page.fill('input[placeholder="密码"]', 'jcdl123@hust');
    await page.click('button:has-text("登录")');
    
    // 等待登录完成
    await page.waitForURL('**/analysis');
    console.log('登录成功');
    
    // 导航到AI面试页面
    await page.click('text=AI面试');
    await page.waitForLoadState('networkidle');
    console.log('进入AI面试页面');
    
    // 测试面试场景
    const interviewScenarios = [
      {
        name: '技术面试',
        questions: [
          '请介绍一下你的技术背景',
          '你熟悉哪些编程语言？',
          '请解释一下什么是面向对象编程',
          '你如何处理项目中的技术难题？'
        ]
      },
      {
        name: '行为面试',
        questions: [
          '请描述一次你解决困难问题的经历',
          '你如何与团队成员合作？',
          '你如何处理工作压力？',
          '你的职业规划是什么？'
        ]
      },
      {
        name: '英语面试',
        questions: [
          'Please introduce yourself',
          'What are your strengths and weaknesses?',
          'Why do you want to work for our company?',
          'Tell me about a challenging project you worked on'
        ]
      }
    ];
    
    const allPerformanceResults = [];
    
    for (const scenario of interviewScenarios) {
      console.log(`\n=== 开始测试 ${scenario.name} ===`);
      
      const scenarioResults = [];
      
      for (const question of scenario.questions) {
        console.log(`\n--- 测试问题: ${question} ---`);
        
        // 找到聊天输入框
        const chatInput = page.locator('input[type="text"], textarea').first();
        await chatInput.clear();
        await chatInput.fill(question);
        
        const startTime = Date.now();
        console.log(`开始测量 "${question}" 的首消息到达时间...`);
        
        // 发送消息
        await page.press('input[type="text"], textarea', 'Enter');
        
        // 等待第一个消息出现
        await page.waitForSelector('.message, [class*="message"], .chat-message, .el-message', { timeout: 30000 });
        const firstMessageTime = Date.now();
        const firstMessageDelay = firstMessageTime - startTime;
        
        console.log(`"${question}" 首消息到达时间: ${firstMessageDelay}ms`);
        
        // 验证消息内容
        const messages = page.locator('.message, [class*="message"], .chat-message, .el-message');
        const messageCount = await messages.count();
        console.log(`收到 ${messageCount} 条消息`);
        
        scenarioResults.push({
          question,
          firstMessageDelay,
          messageCount
        });
        
        // 等待一段时间再进行下一个问题
        await page.waitForTimeout(3000);
      }
      
      // 计算场景性能指标
      const avgDelay = scenarioResults.reduce((sum, r) => sum + r.firstMessageDelay, 0) / scenarioResults.length;
      const maxDelay = Math.max(...scenarioResults.map(r => r.firstMessageDelay));
      const minDelay = Math.min(...scenarioResults.map(r => r.firstMessageDelay));
      
      console.log(`\n${scenario.name} 性能统计:`);
      console.log(`  平均延迟: ${avgDelay.toFixed(2)}ms`);
      console.log(`  最大延迟: ${maxDelay}ms`);
      console.log(`  最小延迟: ${minDelay}ms`);
      
      allPerformanceResults.push({
        scenario: scenario.name,
        results: scenarioResults,
        avgDelay,
        maxDelay,
        minDelay
      });
    }
    
    // 输出整体性能测试结果
    console.log('\n=== AI面试模块整体性能测试结果 ===');
    allPerformanceResults.forEach(scenario => {
      console.log(`\n${scenario.scenario}:`);
      console.log(`  平均延迟: ${scenario.avgDelay.toFixed(2)}ms`);
      console.log(`  最大延迟: ${scenario.maxDelay}ms`);
      console.log(`  最小延迟: ${scenario.minDelay}ms`);
    });
    
    // 计算整体性能指标
    const overallAvgDelay = allPerformanceResults.reduce((sum, s) => sum + s.avgDelay, 0) / allPerformanceResults.length;
    const overallMaxDelay = Math.max(...allPerformanceResults.map(s => s.maxDelay));
    const overallMinDelay = Math.min(...allPerformanceResults.map(s => s.minDelay));
    
    console.log(`\n整体性能指标:`);
    console.log(`  整体平均延迟: ${overallAvgDelay.toFixed(2)}ms`);
    console.log(`  整体最大延迟: ${overallMaxDelay}ms`);
    console.log(`  整体最小延迟: ${overallMinDelay}ms`);
    
    // 验证性能指标
    expect(allPerformanceResults.length).toBeGreaterThan(0);
    allPerformanceResults.forEach(scenario => {
      scenario.results.forEach(result => {
        expect(result.firstMessageDelay).toBeLessThan(15000); // 面试问题首消息应在15秒内到达
        expect(result.messageCount).toBeGreaterThan(0);
      });
    });
    
    // 验证整体性能
    expect(overallAvgDelay).toBeLessThan(8000); // 整体平均延迟应小于8秒
    expect(overallMaxDelay).toBeLessThan(15000); // 最大延迟应小于15秒
  });
});
