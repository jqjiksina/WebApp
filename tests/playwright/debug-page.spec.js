const { test, expect } = require('@playwright/test');

test('调试页面结构', async ({ page }) => {
  // 访问登录页面
  await page.goto('http://222.20.98.159:5180/login');
  await page.waitForLoadState('networkidle');
  
  // 登录
  await page.fill('input[placeholder="用户名"]', 'Admin');
  await page.fill('input[placeholder="密码"]', 'jcdl123@hust');
  await page.click('button:has-text("登录")');
  
  // 等待登录完成
  await page.waitForURL('**/');
  await page.waitForLoadState('networkidle');
  console.log('登录成功，进入系统首页');
  
  // 跳转到简历分析页面
  await page.goto('http://222.20.98.159:5180/analysis/resume');
  await page.waitForLoadState('networkidle');
  console.log('进入简历分析页面');
  
  // 截图并打印页面内容
  await page.screenshot({ path: 'debug-resume-page.png' });
  
  // 打印所有可用的输入框
  const inputs = await page.locator('input, textarea').all();
  console.log(`找到 ${inputs.length} 个输入框:`);
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const tagName = await input.evaluate(el => el.tagName);
    const type = await input.evaluate(el => el.type || 'textarea');
    const placeholder = await input.evaluate(el => el.placeholder || '');
    const className = await input.evaluate(el => el.className || '');
    console.log(`  ${i + 1}. ${tagName} (type: ${type}, placeholder: "${placeholder}", class: "${className}")`);
  }
  
  // 打印所有按钮
  const buttons = await page.locator('button').all();
  console.log(`找到 ${buttons.length} 个按钮:`);
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const className = await button.evaluate(el => el.className || '');
    console.log(`  ${i + 1}. "${text}" (class: "${className}")`);
  }
});


