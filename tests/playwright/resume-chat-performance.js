const { test, expect } = require('@playwright/test');

test.describe('简历分析SSE流式响应性能测试', () => {
  test('测试简历分析完整流程的SSE首消息到达时间', async ({ page }) => {
    // 设置超时时间
    test.setTimeout(120000); // 2分钟超时
    
    // 访问登录页面
    await page.goto('http://222.20.98.159:5180/login');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 登录
    await page.fill('input[placeholder="用户名"]', 'Admin');
    await page.fill('input[placeholder="密码"]', 'jcdl123@hust');
    await page.click('button[type="submit"]');
    
    // 等待登录完成，跳转到主页面
    await page.waitForURL('**/analysis');
    
    // 导航到简历分析页面
    await page.click('text=简历分析');
    await page.waitForLoadState('networkidle');
    
    // 上传简历内容
    const resumeContent = `姓名：张三
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
自我评价：具备扎实的编程基础，熟悉前后端开发，有良好的团队协作能力。`;

    // 找到简历输入框并输入内容
    const resumeInput = page.locator('textarea[placeholder*="简历"]').first();
    await resumeInput.fill(resumeContent);
    
    // 点击上传按钮
    await page.click('button:has-text("上传简历")');
    
    // 等待上传完成
    await page.waitForTimeout(2000);
    
    // 发送"已上传简历"消息
    const chatInput = page.locator('input[placeholder*="输入"]').first();
    await chatInput.fill('已上传简历');
    await page.press('input[placeholder*="输入"]', 'Enter');
    
    // 测量首消息到达时间
    const startTime = Date.now();
    console.log('开始测量首消息到达时间...');
    
    // 等待第一个SSE消息到达（通过检查聊天消息的出现）
    await page.waitForSelector('.message-content, .chat-message, [class*="message"]', { timeout: 30000 });
    const firstMessageTime = Date.now();
    const firstMessageDelay = firstMessageTime - startTime;
    
    console.log(`首消息到达时间: ${firstMessageDelay}ms`);
    
    // 验证首消息内容
    const firstMessage = page.locator('.message-content, .chat-message, [class*="message"]').first();
    await expect(firstMessage).toBeVisible();
    
    // 测试关键词流程
    const keywords = ['简历提问', '简历回答', '英语提问', '英语回答'];
    
    for (const keyword of keywords) {
      console.log(`测试关键词: ${keyword}`);
      
      // 清空输入框并输入关键词
      await chatInput.clear();
      await chatInput.fill(keyword);
      
      // 测量关键词的首消息到达时间
      const keywordStartTime = Date.now();
      await page.press('input[placeholder*="输入"]', 'Enter');
      
      // 等待新的消息出现
      await page.waitForSelector('.message-content, .chat-message, [class*="message"]', { timeout: 30000 });
      const keywordFirstMessageTime = Date.now();
      const keywordFirstMessageDelay = keywordFirstMessageTime - keywordStartTime;
      
      console.log(`${keyword} 首消息到达时间: ${keywordFirstMessageDelay}ms`);
      
      // 等待一段时间让消息完全加载
      await page.waitForTimeout(2000);
    }
    
    // 验证所有消息都正确显示
    const messages = page.locator('.message-content, .chat-message, [class*="message"]');
    const messageCount = await messages.count();
    console.log(`总共收到 ${messageCount} 条消息`);
    
    expect(messageCount).toBeGreaterThan(0);
  });
  
  test('测试简历分析并发性能', async ({ browser }) => {
    // 创建多个浏览器上下文来模拟并发用户
    const contexts = [];
    const pages = [];
    
    try {
      // 创建3个并发用户
      for (let i = 0; i < 3; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }
      
      // 并发登录和测试
      const loginPromises = pages.map(async (page, index) => {
        await page.goto('http://222.20.98.159:5180/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[placeholder="用户名"]', 'Admin');
        await page.fill('input[placeholder="密码"]', 'jcdl123@hust');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/analysis');
        await page.click('text=简历分析');
        await page.waitForLoadState('networkidle');
        console.log(`用户 ${index + 1} 登录完成`);
      });
      
      await Promise.all(loginPromises);
      
      // 并发测试简历分析
      const testPromises = pages.map(async (page, index) => {
        const resumeContent = `姓名：测试用户${index + 1}
性别：男
年龄：25岁
学历：本科
专业：计算机科学与技术
工作经验：3年`;

        const resumeInput = page.locator('textarea[placeholder*="简历"]').first();
        await resumeInput.fill(resumeContent);
        await page.click('button:has-text("上传简历")');
        await page.waitForTimeout(2000);
        
        const chatInput = page.locator('input[placeholder*="输入"]').first();
        await chatInput.fill('已上传简历');
        
        const startTime = Date.now();
        await page.press('input[placeholder*="输入"]', 'Enter');
        await page.waitForSelector('.message-content, .chat-message, [class*="message"]', { timeout: 30000 });
        const firstMessageTime = Date.now();
        const delay = firstMessageTime - startTime;
        
        console.log(`用户 ${index + 1} 首消息到达时间: ${delay}ms`);
        return delay;
      });
      
      const delays = await Promise.all(testPromises);
      const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
      const maxDelay = Math.max(...delays);
      const minDelay = Math.min(...delays);
      
      console.log(`并发测试结果:`);
      console.log(`平均首消息到达时间: ${avgDelay}ms`);
      console.log(`最大延迟: ${maxDelay}ms`);
      console.log(`最小延迟: ${minDelay}ms`);
      
      // 验证性能指标
      expect(avgDelay).toBeLessThan(10000); // 平均延迟小于10秒
      expect(maxDelay).toBeLessThan(15000); // 最大延迟小于15秒
      
    } finally {
      // 清理资源
      for (const context of contexts) {
        await context.close();
      }
    }
  });
});
