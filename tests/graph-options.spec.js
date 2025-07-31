import { test, expect } from '@playwright/test';

test.describe('Graph Options Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to our test page with Flotr2 loaded
    await page.goto('/tests/test-page.html');
    
    // Wait for Flotr2 to load
    await page.waitForFunction(() => {
      return typeof window.Flotr !== 'undefined';
    }, { timeout: 10000 });
  });

  test.describe('Options Handling', () => {
    
    test('should override nested default options with user options', async ({ page }) => {
      const optionOverride = await page.evaluate(() => {
        // Create test data
        const d1 = [];
        for (let i = 0; i < 100; i++) {
          const x = (i * 1000 * 3600 * 24 * 36.5);
          d1.push([x, i + Math.random() * 30 + Math.sin(i / 20 + Math.random() * 2) * 20 + Math.sin(i / 10 + Math.random()) * 10]);
        }
        
        const options = {
          xaxis: {
            mode: 'time',
            labelsAngle: 45
          },
          selection: {
            mode: 'x'
          },
          HtmlText: false,
        };
        
        // Create container
        const container = document.createElement('div');
        container.style.width = '320px';
        container.style.height = '240px';
        document.body.appendChild(container);
        
        try {
          const graph = new Flotr.Graph(container, d1, options);
          const result = graph.options.xaxis.mode === options.xaxis.mode;
          
          // Cleanup
          document.body.removeChild(container);
          return result;
        } catch (e) {
          document.body.removeChild(container);
          throw e;
        }
      });
      
      expect(optionOverride).toBe(true);
    });

    test('should retain default options if user option\'s nested object does not define property', async ({ page }) => {
      const defaultRetention = await page.evaluate(() => {
        // Create test data
        const d1 = [];
        for (let i = 0; i < 100; i++) {
          const x = (i * 1000 * 3600 * 24 * 36.5);
          d1.push([x, i + Math.random() * 30 + Math.sin(i / 20 + Math.random() * 2) * 20 + Math.sin(i / 10 + Math.random()) * 10]);
        }
        
        const options = {
          xaxis: {
            mode: 'time',
            labelsAngle: 45
          },
          selection: {
            mode: 'x'
          },
          HtmlText: false,
        };
        
        // Create container
        const container = document.createElement('div');
        container.style.width = '320px';
        container.style.height = '240px';
        document.body.appendChild(container);
        
        try {
          const graph = new Flotr.Graph(container, d1, options);
          const result = !!graph.options.xaxis.tickFormatter;
          
          // Cleanup
          document.body.removeChild(container);
          return result;
        } catch (e) {
          document.body.removeChild(container);
          throw e;
        }
      });
      
      expect(defaultRetention).toBe(true);
    });

    test('should not affect default options when modifying graph options (objects)', async ({ page }) => {
      const defaultPreservation = await page.evaluate(() => {
        // Create test data
        const d1 = [];
        for (let i = 0; i < 100; i++) {
          const x = (i * 1000 * 3600 * 24 * 36.5);
          d1.push([x, i + Math.random() * 30 + Math.sin(i / 20 + Math.random() * 2) * 20 + Math.sin(i / 10 + Math.random()) * 10]);
        }
        
        const options = {
          xaxis: {
            mode: 'time',
            labelsAngle: 45
          },
          selection: {
            mode: 'x'
          },
          HtmlText: false,
        };
        
        // Store original default values
        const originalXaxisScaling = Flotr.defaultOptions.xaxis.scaling;
        const originalX2axisTitleAlign = Flotr.defaultOptions.x2axis.titleAlign;
        
        // Create container
        const container = document.createElement('div');
        container.style.width = '320px';
        container.style.height = '240px';
        document.body.appendChild(container);
        
        try {
          const graph = new Flotr.Graph(container, d1, options);
          
          // Modify graph options
          graph.options.x2axis = {
            titleAlign: 'left'
          };
          graph.options.xaxis.scaling = 'logarithmic';
          
          // Check that defaults weren't affected
          const scalingPreserved = Flotr.defaultOptions.xaxis.scaling === originalXaxisScaling;
          const titleAlignPreserved = Flotr.defaultOptions.x2axis.titleAlign === originalX2axisTitleAlign;
          
          // Cleanup
          document.body.removeChild(container);
          
          return {
            scalingPreserved,
            titleAlignPreserved,
            originalScaling: originalXaxisScaling,
            currentScaling: Flotr.defaultOptions.xaxis.scaling
          };
        } catch (e) {
          document.body.removeChild(container);
          throw e;
        }
      });
      
      expect(defaultPreservation.scalingPreserved).toBe(true);
      expect(defaultPreservation.titleAlignPreserved).toBe(true);
      expect(defaultPreservation.originalScaling).toBe('linear');
    });
  });
});