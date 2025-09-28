const { test, expect } = require('@playwright/test');

test.describe('数字人WebRTC连接性能测试', () => {
  test('测试数字人WebRTC连接建立和关闭性能', async ({ page }) => {
    // 设置超时时间
    test.setTimeout(120000);
    
    console.log('开始测试数字人WebRTC连接性能...');
    
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
    
    // 导航到数字人页面
    await page.click('text=数字人');
    await page.waitForLoadState('networkidle');
    console.log('进入数字人页面');
    
    // 测试WebRTC连接建立性能
    const connectionTests = [];
    
    for (let i = 1; i <= 3; i++) {
      console.log(`\n=== 第 ${i} 次连接测试 ===`);
      
      // 点击开始对话按钮
      const startButton = page.locator('button:has-text("开始对话"), button:has-text("启动数字人")').first();
      await startButton.waitFor({ state: 'visible', timeout: 10000 });
      
      const connectionStartTime = Date.now();
      console.log('开始建立WebRTC连接...');
      
      await startButton.click();
      
      // 等待WebRTC连接建立（通过检查视频元素或连接状态）
      await page.waitForSelector('video, [class*="video"], [class*="stream"]', { timeout: 30000 });
      const connectionEstablishedTime = Date.now();
      const connectionDelay = connectionEstablishedTime - connectionStartTime;
      
      console.log(`WebRTC连接建立时间: ${connectionDelay}ms`);
      
      // 验证连接状态
      const videoElement = page.locator('video').first();
      const isVideoVisible = await videoElement.isVisible();
      console.log(`视频流是否可见: ${isVideoVisible}`);
      
      // 测试连接稳定性（等待一段时间）
      await page.waitForTimeout(5000);
      
      // 测试WebRTC连接关闭性能
      const closeButton = page.locator('button:has-text("结束对话"), button:has-text("关闭连接")').first();
      if (await closeButton.isVisible()) {
        const closeStartTime = Date.now();
        console.log('开始关闭WebRTC连接...');
        
        await closeButton.click();
        
        // 等待连接关闭（视频元素消失或连接状态改变）
        await page.waitForSelector('video, [class*="video"], [class*="stream"]', { state: 'hidden', timeout: 10000 });
        const connectionClosedTime = Date.now();
        const closeDelay = connectionClosedTime - closeStartTime;
        
        console.log(`WebRTC连接关闭时间: ${closeDelay}ms`);
        
        connectionTests.push({
          testNumber: i,
          connectionDelay,
          closeDelay,
          isVideoVisible,
          totalTime: connectionDelay + closeDelay
        });
      } else {
        console.log('未找到关闭按钮，跳过关闭测试');
        connectionTests.push({
          testNumber: i,
          connectionDelay,
          closeDelay: 0,
          isVideoVisible,
          totalTime: connectionDelay
        });
      }
      
      // 等待一段时间再进行下一次测试
      await page.waitForTimeout(3000);
    }
    
    // 输出WebRTC连接性能测试结果
    console.log('\n=== WebRTC连接性能测试结果 ===');
    connectionTests.forEach(test => {
      console.log(`\n第 ${test.testNumber} 次测试:`);
      console.log(`  连接建立时间: ${test.connectionDelay}ms`);
      console.log(`  连接关闭时间: ${test.closeDelay}ms`);
      console.log(`  总耗时: ${test.totalTime}ms`);
      console.log(`  视频流可见: ${test.isVideoVisible}`);
    });
    
    // 计算性能统计
    const avgConnectionDelay = connectionTests.reduce((sum, t) => sum + t.connectionDelay, 0) / connectionTests.length;
    const avgCloseDelay = connectionTests.filter(t => t.closeDelay > 0).reduce((sum, t) => sum + t.closeDelay, 0) / connectionTests.filter(t => t.closeDelay > 0).length;
    const maxConnectionDelay = Math.max(...connectionTests.map(t => t.connectionDelay));
    const minConnectionDelay = Math.min(...connectionTests.map(t => t.connectionDelay));
    
    console.log(`\n性能统计:`);
    console.log(`  平均连接建立时间: ${avgConnectionDelay.toFixed(2)}ms`);
    console.log(`  最大连接建立时间: ${maxConnectionDelay}ms`);
    console.log(`  最小连接建立时间: ${minConnectionDelay}ms`);
    if (!isNaN(avgCloseDelay)) {
      console.log(`  平均连接关闭时间: ${avgCloseDelay.toFixed(2)}ms`);
    }
    
    // 验证性能指标
    expect(connectionTests.length).toBeGreaterThan(0);
    connectionTests.forEach(test => {
      expect(test.connectionDelay).toBeLessThan(10000); // 连接建立应在10秒内完成
      expect(test.isVideoVisible).toBe(true); // 视频流应该可见
    });
    
    // 验证整体性能
    expect(avgConnectionDelay).toBeLessThan(5000); // 平均连接建立时间应小于5秒
    expect(maxConnectionDelay).toBeLessThan(10000); // 最大连接建立时间应小于10秒
  });
  
  test('测试数字人会话限制机制', async ({ page }) => {
    // 设置超时时间
    test.setTimeout(60000);
    
    console.log('开始测试数字人会话限制机制...');
    
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
    
    // 导航到数字人页面
    await page.click('text=数字人');
    await page.waitForLoadState('networkidle');
    console.log('进入数字人页面');
    
    // 尝试快速创建多个连接来测试会话限制
    const maxAttempts = 5;
    const sessionResults = [];
    
    for (let i = 1; i <= maxAttempts; i++) {
      console.log(`\n=== 第 ${i} 次会话尝试 ===`);
      
      try {
        const startButton = page.locator('button:has-text("开始对话"), button:has-text("启动数字人")').first();
        await startButton.waitFor({ state: 'visible', timeout: 5000 });
        
        const attemptStartTime = Date.now();
        await startButton.click();
        
        // 等待响应
        await page.waitForTimeout(2000);
        
        // 检查是否出现会话限制提示
        const limitMessage = page.locator('text=会话限制, text=达到最大会话数, text=session limit').first();
        const isLimited = await limitMessage.isVisible();
        
        const attemptTime = Date.now() - attemptStartTime;
        
        if (isLimited) {
          console.log(`第 ${i} 次尝试被限制，耗时: ${attemptTime}ms`);
          sessionResults.push({
            attempt: i,
            success: false,
            limited: true,
            time: attemptTime
          });
        } else {
          console.log(`第 ${i} 次尝试成功，耗时: ${attemptTime}ms`);
          sessionResults.push({
            attempt: i,
            success: true,
            limited: false,
            time: attemptTime
          });
          
          // 尝试关闭连接
          const closeButton = page.locator('button:has-text("结束对话"), button:has-text("关闭连接")').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          }
        }
      } catch (error) {
        console.log(`第 ${i} 次尝试失败: ${error.message}`);
        sessionResults.push({
          attempt: i,
          success: false,
          limited: false,
          error: error.message,
          time: 0
        });
      }
      
      // 等待一段时间再进行下一次尝试
      await page.waitForTimeout(2000);
    }
    
    // 输出会话限制测试结果
    console.log('\n=== 会话限制测试结果 ===');
    sessionResults.forEach(result => {
      console.log(`第 ${result.attempt} 次尝试: ${result.success ? '成功' : '失败'} (${result.limited ? '被限制' : '其他原因'}) - ${result.time}ms`);
    });
    
    const successCount = sessionResults.filter(r => r.success).length;
    const limitedCount = sessionResults.filter(r => r.limited).length;
    
    console.log(`\n统计结果:`);
    console.log(`  成功连接: ${successCount}/${maxAttempts}`);
    console.log(`  被限制连接: ${limitedCount}/${maxAttempts}`);
    console.log(`  限制率: ${(limitedCount / maxAttempts * 100).toFixed(2)}%`);
    
    // 验证会话限制机制
    expect(sessionResults.length).toBe(maxAttempts);
    expect(limitedCount).toBeGreaterThan(0); // 应该至少有一次被限制
  });
});
