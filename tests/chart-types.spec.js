import { test, expect } from '@playwright/test';

test.describe('Chart Types Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to our test page with Flotr2 loaded
    await page.goto('/tests/test-page.html');
    
    // Wait for Flotr2 to load
    await page.waitForFunction(() => {
      return typeof window.Flotr !== 'undefined';
    }, { timeout: 10000 });
  });

  test.describe('Lines Chart Type', () => {
    
    test('draws a line chart', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.getElementById('chart');
        container.innerHTML = '';
        
        const data = [
          [0, 0],
          [240, 300], 
          [480, 0]
        ];
        
        Flotr.draw(container, [{ data: data }], {
          lines: { show: true },
          HtmlText: false
        });
      });
      
      await page.waitForTimeout(500);
      await expect(page.locator('#chart')).toHaveScreenshot('line-chart-basic.png');
    });

    test('skips null values', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.getElementById('chart');
        container.innerHTML = '';
        
        const data = [
          [0, 0],
          [100, 50],
          [200, null],
          [300, 150],
          [400, 200],
          [480, 240]
        ];
        
        Flotr.draw(container, [{ data: data }], {
          lines: { show: true },
          HtmlText: false
        });
      });
      
      await page.waitForTimeout(500);
      await expect(page.locator('#chart')).toHaveScreenshot('line-chart-null-values.png');
    });

    test('draws two lines', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.getElementById('chart');
        container.innerHTML = '';
        
        const data1 = [[0, 0], [240, 160], [480, 320]];
        const data2 = [[0, 320], [240, 160], [480, 0]];
        
        Flotr.draw(container, [
          { data: data1, label: 'Line 1' },
          { data: data2, label: 'Line 2' }
        ], {
          lines: { show: true },
          HtmlText: false
        });
      });
      
      await page.waitForTimeout(500);
      await expect(page.locator('#chart')).toHaveScreenshot('line-chart-two-lines.png');
    });

    test('fills a line', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.getElementById('chart');
        container.innerHTML = '';
        
        const data = [
          [0, 0],
          [240, 300],
          [480, 0]
        ];
        
        Flotr.draw(container, [{ data: data }], {
          lines: { 
            show: true,
            fill: true
          },
          HtmlText: false
        });
      });
      
      await page.waitForTimeout(500);
      await expect(page.locator('#chart')).toHaveScreenshot('line-chart-filled.png');
    });

    test('draws no shadow', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.getElementById('chart');
        container.innerHTML = '';
        
        const data = [
          [0, 0],
          [240, 300],
          [480, 0]
        ];
        
        Flotr.draw(container, [{ data: data }], {
          lines: { show: true },
          shadowSize: 0,
          HtmlText: false
        });
      });
      
      await page.waitForTimeout(500);
      await expect(page.locator('#chart')).toHaveScreenshot('line-chart-no-shadow.png');
    });
  });
});