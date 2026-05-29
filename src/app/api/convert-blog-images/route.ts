import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  const baseDir = '/home/nirosh/.gemini/antigravity/brain/af0bccf4-cb3b-465e-a75f-8ebf8d04b256';
  const artifactsDir = path.join(baseDir, 'artifacts');

  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const files = [
    { src: 'blog_list_page_1779987524672.png', dest: 'blog_list_page.png' },
    { src: 'galle_kandy_detail_1779987585643.png', dest: 'galle_kandy_detail.png' }
  ];

  const results = [];

  for (const f of files) {
    const srcPath = path.join(baseDir, f.src);
    const destPath = path.join(artifactsDir, f.dest);

    if (fs.existsSync(srcPath)) {
      try {
        fs.copyFileSync(srcPath, destPath);
        results.push({ name: f.dest, status: 'success' });
      } catch (err: any) {
        results.push({ name: f.dest, status: 'error', error: err.message });
      }
    } else {
      results.push({ name: f.dest, status: 'missing', path: srcPath });
    }
  }

  return NextResponse.json({
    message: 'Copying completed',
    results
  });
}
