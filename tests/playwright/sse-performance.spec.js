const { test, expect } = require('@playwright/test');

test.describe('SSE流式响应性能测试', () => {
  test('测试简历分析SSE首消息到达时间', async ({ page }) => {
    // 设置超时时间
    test.setTimeout(120000);
    
    console.log('开始测试SSE流式响应性能...');
    
    // 访问登录页面
    await page.goto('http://222.20.98.159:5180/login');
    await page.waitForLoadState('networkidle');
    
    // 登录
    await page.fill('input[placeholder="用户名"]', 'Admin');
    await page.fill('input[placeholder="密码"]', 'jcdl123@hust');
    
    // 点击 Element UI 登录按钮
    await page.click('button:has-text("登录")');
    
    // 等待登录完成
    await page.waitForURL('**/analysis');
    console.log('登录成功');
    
    // 导航到简历分析页面
    await page.click('text=简历分析');
    await page.waitForLoadState('networkidle');
    console.log('进入简历分析页面');
    
    // 上传简历内容
    const resumeContent = `姓名：张三
性别：男
年龄：25岁
学历：本科
专业：计算机科学与技术
工作经验：3年
技能：Java, Python, JavaScript, React, Vue.js`;

    // 找到简历输入框并输入内容
    const resumeInput = page.locator('textarea').first();
    await resumeInput.fill(resumeContent);
    console.log('简历内容已输入');
    
    // 点击上传按钮
    await page.click('button:has-text("上传简历")');
    await page.waitForTimeout(2000);
    console.log('简历已上传');
    
    // 测试多个关键词的SSE响应性能
    const testKeywords = ['已上传简历', '简历提问', '简历回答', '英语提问', '英语回答'];
    const performanceResults = [];
    
    for (const keyword of testKeywords) {
      console.log(`\n=== 测试关键词: ${keyword} ===`);
      
      // 找到聊天输入框
      const chatInput = page.locator('input[type="text"], textarea').first();
      await chatInput.clear();
      await chatInput.fill(keyword);
      
      const startTime = Date.now();
      console.log(`开始测量 ${keyword} 的首消息到达时间...`);
      
      // 发送消息
      await page.press('input[type="text"], textarea', 'Enter');
      
      // 等待第一个消息出现
      await page.waitForSelector('.message, [class*="message"], .chat-message, .el-message', { timeout: 30000 });
      const firstMessageTime = Date.now();
      const firstMessageDelay = firstMessageTime - startTime;
      
      console.log(`${keyword} 首消息到达时间: ${firstMessageDelay}ms`);
      
      // 验证消息内容
      const messages = page.locator('.message, [class*="message"], .chat-message, .el-message');
      const messageCount = await messages.count();
      console.log(`收到 ${messageCount} 条消息`);
      
      performanceResults.push({
        keyword,
        firstMessageDelay,
        messageCount
      });
      
      // 等待一段时间再进行下一个测试
      await page.waitForTimeout(2000);
    }
    
    // 输出性能测试结果
    console.log('\n=== 简历分析性能测试结果 ===');
    performanceResults.forEach(result => {
      console.log(`${result.keyword}: ${result.firstMessageDelay}ms (${result.messageCount}条消息)`);
    });
    
    const avgDelay = performanceResults.reduce((sum, r) => sum + r.firstMessageDelay, 0) / performanceResults.length;
    console.log(`平均首消息延迟: ${avgDelay.toFixed(2)}ms`);
    
    // 验证性能指标
    expect(performanceResults.length).toBeGreaterThan(0);
    performanceResults.forEach(result => {
      expect(result.firstMessageDelay).toBeLessThan(10000); // 首消息应在10秒内到达
      expect(result.messageCount).toBeGreaterThan(0);
    });
  });
});
