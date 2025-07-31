import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests - Examples', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to our examples test page
    await page.goto('/tests/visual-regression.spec.html');
    
    // Wait for Flotr2 and examples to load
    await page.waitForFunction(() => {
      return typeof window.Flotr !== 'undefined' && 
             window.Flotr.ExampleList && 
             Object.keys(window.Flotr.ExampleList.examples).length > 0;
    }, { timeout: 10000 });
  });

  // Get list of all examples and create individual tests
  const exampleTests = [
    'basic',
    'basic-axis', 
    'basic-bars',
    'basic-bars-stacked',
    'basic-bubble',
    'basic-candle',
    'basic-candle-barchart',
    'basic-legend',
    'basic-pie',
    'basic-radar',
    'basic-stacked',
    'basic-stepped',
    'basic-time',
    'basic-timeline',
    'advanced-markers',
    'advanced-titles',
    'click-example',
    'color-gradients',
    'download-data',
    'download-image',
    'mouse-drag',
    'mouse-tracking',
    'mouse-zoom',
    'negative-values',
    'profile-bars'
  ];

  // Create a test for each example
  for (const exampleKey of exampleTests) {
    test(`should render ${exampleKey} example correctly`, async ({ page }) => {
      
      // Clear the chart container and render the example
      await page.evaluate((key) => {
        const container = document.getElementById('chart');
        
        // Clear any existing content
        container.innerHTML = '';
        
        // Get the example
        const example = Flotr.ExampleList.get(key);
        if (!example) {
          throw new Error(`Example '${key}' not found`);
        }
        
        // Set random seed if example has one
        if (example.key) {
          Math.seedrandom(example.key);
        }
        
        // Execute the example
        try {
          example.callback.apply(this, [container].concat(example.args || []));
        } catch (e) {
          console.error(`Error rendering example ${key}:`, e);
          throw e;
        }
      }, exampleKey);
      
      // Wait a bit for rendering to complete
      await page.waitForTimeout(500);
      
      // Take screenshot for visual comparison
      await expect(page.locator('#chart')).toHaveScreenshot(`${exampleKey}-example.png`);
    });
  }

  test.describe('Main API Tests', () => {
    
    test('getTickSize function should work correctly', async ({ page }) => {
      const tickSizeTests = await page.evaluate(() => {
        if (!Flotr.getTickSize) {
          return { error: 'getTickSize function not found' };
        }
        
        return {
          test1: Flotr.getTickSize(10, 0, 100, 1),
          test2: Flotr.getTickSize(20, 0, 100, 1), 
          test3: Flotr.getTickSize(5, 10, 110, 1),
          test4: Flotr.getTickSize(0, 0, 10, 1),
          test5: Flotr.getTickSize(0, 0, -10, 1)
        };
      });
      
      expect(tickSizeTests.test1).toBe(10);
      expect(tickSizeTests.test2).toBe(5);
      expect(tickSizeTests.test3).toBe(20);
      expect(tickSizeTests.test4).toBe(Number.POSITIVE_INFINITY);
      expect(isNaN(tickSizeTests.test5)).toBe(true);
    });
  });
});
