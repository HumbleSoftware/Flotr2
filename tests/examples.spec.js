import { test, expect } from '@playwright/test';

test.describe('Built Examples Tests', () => {
  
  test('examples page loads without errors', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/examples/dev.html');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    expect(errors).toEqual([]);
    
    // Check that Flotr is defined
    const flotrDefined = await page.evaluate(() => typeof window.Flotr !== 'undefined');
    expect(flotrDefined).toBe(true);
    
    // Take snapshot
    await expect(page).toHaveScreenshot('examples-page-loads.png');
  });

  test('can load and render a basic example', async ({ page }) => {
    await page.goto('/examples/dev.html');
    await page.waitForLoadState('networkidle');
    
    // Wait for examples to load and click first thumbnail
    await page.waitForSelector('.flotr-examples-thumb');
    await page.click('.flotr-examples-thumb:first-child');
    
    // Wait for example to load
    await page.waitForSelector('.flotr-example canvas');
    
    // Take snapshot of rendered example
    await expect(page).toHaveScreenshot('basic-example-rendered.png');
  });
});
