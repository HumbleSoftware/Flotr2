import { test, expect } from '@playwright/test';

test.describe('Color Unit Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to our test page with Flotr2 loaded
    await page.goto('/tests/test-page.html');
    
    // Wait for Flotr2 to load
    await page.waitForFunction(() => {
      return typeof window.Flotr !== 'undefined';
    }, { timeout: 10000 });
  });

  test.describe('Color Construction', () => {
    
    test('should have a color class', async ({ page }) => {
      const hasColorClass = await page.evaluate(() => {
        return typeof Flotr.Color !== 'undefined';
      });
      expect(hasColorClass).toBe(true);
    });

    test('should create a color', async ({ page }) => {
      const colorCreated = await page.evaluate(() => {
        const color = new Flotr.Color(0, 0, 0, 0);
        return !!color;
      });
      expect(colorCreated).toBe(true);
    });

    test('should have rgba attributes', async ({ page }) => {
      const colorAttributes = await page.evaluate(() => {
        const color = new Flotr.Color(0, 0, 0, 0);
        return {
          r: color.r,
          g: color.g,
          b: color.b,
          a: color.a
        };
      });
      
      expect(colorAttributes.r).toBe(0);
      expect(colorAttributes.g).toBe(0);
      expect(colorAttributes.b).toBe(0);
      expect(colorAttributes.a).toBe(1.0);
    });
  });

  test.describe('Color Manipulation', () => {
    
    test('normalizes colors to upper bound', async ({ page }) => {
      const normalizedColor = await page.evaluate(() => {
        const color = new Flotr.Color(1000, 1000, 1000, 10);
        return {
          r: color.r,
          g: color.g,
          b: color.b,
          a: color.a
        };
      });
      
      expect(normalizedColor.r).toBe(255);
      expect(normalizedColor.g).toBe(255);
      expect(normalizedColor.b).toBe(255);
      expect(normalizedColor.a).toBe(1.0);
    });

    test('normalizes colors to lower bound', async ({ page }) => {
      const normalizedColor = await page.evaluate(() => {
        const color = new Flotr.Color(-1000, -1000, -1000, -10);
        return {
          r: color.r,
          g: color.g,
          b: color.b,
          a: color.a
        };
      });
      
      expect(normalizedColor.r).toBe(0);
      expect(normalizedColor.g).toBe(0);
      expect(normalizedColor.b).toBe(0);
      expect(normalizedColor.a).toBe(0.0);
    });

    test('scales colors', async ({ page }) => {
      const scaledColor = await page.evaluate(() => {
        const color = new Flotr.Color(200, 200, 200, 1.0);
        color.scale(0.5, 0.5, 0.5, 0.5);
        return {
          r: color.r,
          g: color.g,
          b: color.b,
          a: color.a
        };
      });
      
      expect(scaledColor.r).toBe(100);
      expect(scaledColor.g).toBe(100);
      expect(scaledColor.b).toBe(100);
      expect(scaledColor.a).toBe(0.5);
    });
  });

  test.describe('Color Conversion', () => {
    
    test('should convert colors to strings, rgb', async ({ page }) => {
      const colorString = await page.evaluate(() => {
        const color = new Flotr.Color(200, 200, 200, 1.0);
        return color.toString();
      });
      
      expect(colorString).toBe('rgb(200,200,200)');
    });

    test('should convert colors to strings, rgba', async ({ page }) => {
      const colorString = await page.evaluate(() => {
        const color = new Flotr.Color(200, 200, 200, 1.0);
        color.a = 0.5;
        color.normalize();
        return color.toString();
      });
      
      expect(colorString).toBe('rgba(200,200,200,0.5)');
    });

    test('should clone colors', async ({ page }) => {
      const cloneTest = await page.evaluate(() => {
        const color = new Flotr.Color(200, 200, 200, 1.0);
        const color2 = color.clone();
        
        const firstTest = color.toString() === color2.toString();
        
        color.a = 0.5;
        color.normalize();
        const color3 = color.clone();
        const secondTest = color.toString() === color3.toString();
        
        return { firstTest, secondTest };
      });
      
      expect(cloneTest.firstTest).toBe(true);
      expect(cloneTest.secondTest).toBe(true);
    });
  });
});
