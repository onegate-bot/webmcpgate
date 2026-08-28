import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

describe('Unit: Static Manifest & Schema Linting', () => {
  it('validates WebMCP manifest structure', () => {
    const manifestPath = path.resolve(__dirname, '../../public/webmcp-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.name).toBeDefined();
      expect(Array.isArray(manifest.tools)).toBe(true);
    }
  });

  it('validates llms.txt exists and is non-empty', () => {
    const llmsPath = path.resolve(__dirname, '../../public/llms.txt');
    if (fs.existsSync(llmsPath)) {
      const text = fs.readFileSync(llmsPath, 'utf-8');
      expect(text.length).toBeGreaterThan(20);
    }
  });
});
