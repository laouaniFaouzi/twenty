import { type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE_ORIGIN_FILE = path.resolve(__dirname, '.auth', 'workspace-origin.txt');

export const SCREENSHOT_DIR = path.resolve(__dirname, '.results', 'screenshots');

export const workspaceUrl = (): string => {
  try {
    return fs.readFileSync(WORKSPACE_ORIGIN_FILE, 'utf8').trim().replace(/\/$/, '');
  } catch {
    return 'http://localhost:3001';
  }
};

export const shoot = async (page: Page, name: string) => {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
};
