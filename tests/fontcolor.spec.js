import { test, expect } from '@playwright/test';

test.describe('FontColor Visual Regression Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to our test page with Flotr2 loaded
    await page.goto('/tests/test-page.html');

    // Wait for Flotr2 to load, with error handling
    await page.waitForFunction(() => {
      if (typeof window.Flotr !== 'undefined') {
        return true;
      }
      // Log any errors to help debug
      if (window.console && window.console.error) {
        console.log('Flotr2 not yet loaded, checking...');
      }
      return false;
    }, { timeout: 10000 });
  });

  test('default fontColor behavior', async ({ page }) => {
    await page.evaluate(() => {
      const data = [[0, 0], [1, 4], [2, 8], [3, 6], [4, 10], [5, 7]];
      window.chart = Flotr.draw(document.getElementById('chart'), 
        [{ data: data, label: 'Test Series' }], 
        {
          title: 'Default Font Color Test',
          xaxis: { title: 'X Axis Title' },
          yaxis: { title: 'Y Axis Title' },
          HtmlText: false
        }
      );
    });
    
    // Take screenshot for visual comparison
    await expect(page.locator('#chart')).toHaveScreenshot('fontcolor-default.png');
  });

  test('custom fontColor should affect axis titles', async ({ page }) => {
    await page.evaluate(() => {
      const data = [[0, 0], [1, 4], [2, 8], [3, 6], [4, 10], [5, 7]];
      
      window.chart = Flotr.draw(document.getElementById('chart'), 
        [{ data: data, label: 'Test Series' }], 
        {
          title: 'Custom Font Color Test',
          fontColor: '#ff0000', // Red - should now affect axis titles!
          xaxis: { title: 'X Axis Title (should be red)' },
          yaxis: { title: 'Y Axis Title (should be red)' },
          HtmlText: false
        }
      );
    });
    
    await expect(page.locator('#chart')).toHaveScreenshot('fontcolor-custom-red.png');
  });

  test('fontColor vs gridColor independence', async ({ page }) => {
    await page.evaluate(() => {
      const data = [[0, 0], [1, 4], [2, 8], [3, 6], [4, 10], [5, 7]];
      
      window.chart = Flotr.draw(document.getElementById('chart'), 
        [{ data: data, label: 'Test Series' }], 
        {
          title: 'FontColor vs GridColor Test',
          fontColor: '#ff0000', // Red text
          grid: { color: '#0000ff' }, // Blue grid
          xaxis: { title: 'X Axis (should be red, not blue)' },
          yaxis: { title: 'Y Axis (should be red, not blue)' },
          HtmlText: false
        }
      );
    });
    
    await expect(page.locator('#chart')).toHaveScreenshot('fontcolor-vs-gridcolor.png');
  });

  test('HTML text mode also respects fontColor', async ({ page }) => {
    await page.evaluate(() => {
      const data = [[0, 0], [1, 4], [2, 8], [3, 6], [4, 10], [5, 7]];
      
      window.chart = Flotr.draw(document.getElementById('chart'), 
        [{ data: data, label: 'Test Series' }], 
        {
          title: 'HTML Text Mode FontColor Test',
          fontColor: '#00aa00', // Green
          xaxis: { title: 'X Axis Title (green)' },
          yaxis: { title: 'Y Axis Title (green)' },
          HtmlText: true // HTML mode
        }
      );
    });
    
    await expect(page.locator('#chart')).toHaveScreenshot('fontcolor-html-mode.png');
  });
});
