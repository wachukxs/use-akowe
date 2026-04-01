import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth-server', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/lib/auth-server';
import { POST as toolsImportPost } from '@/app/api/tools/import/route';
import { POST as projectsImportPost } from '@/app/api/projects/import/route';

function makeMultipartRequest(file?: File, headers?: Record<string, string>): Request {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  } else {
    // happy-dom requires at least one field for valid multipart boundaries.
    formData.append('placeholder', '1');
  }
  return new Request('http://localhost/api/test', {
    method: 'POST',
    body: formData,
    headers,
  });
}

describe('Import route integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects spoofed PDF file in tools import route', async () => {
    const fakePdf = new File(['not a real pdf'], 'fake.pdf', { type: 'application/pdf' });
    const response = await toolsImportPost(makeMultipartRequest(fakePdf) as unknown as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errorCode).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('imports txt file in tools import route', async () => {
    const txtFile = new File(
      ['Introduction\nThis is an academic paragraph with sufficient text for import analysis.'],
      'sample.txt',
      { type: 'text/plain' }
    );

    const response = await toolsImportPost(makeMultipartRequest(txtFile) as unknown as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.wordCount).toBeGreaterThan(5);
    expect(body.metadata.fileType).toBe('txt');
  });

  it('returns localized no-file error', async () => {
    const response = await toolsImportPost(
      makeMultipartRequest(undefined, { 'accept-language': 'es-ES' }) as unknown as NextRequest
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errorCode).toBe('NO_FILE_PROVIDED');
    expect(body.error).toContain('No se proporciono');
  });

  it('returns unauthorized for project import when auth missing', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const txtFile = new File(['Simple content'], 'sample.txt', { type: 'text/plain' });
    const response = await projectsImportPost(makeMultipartRequest(txtFile) as unknown as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('imports txt file in project import when authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'student@example.com' } } as never);
    const txtFile = new File(
      ['Introduction\nA valid research text body with more than a few words for parsing.'],
      'project.txt',
      { type: 'text/plain' }
    );

    const response = await projectsImportPost(makeMultipartRequest(txtFile) as unknown as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.extracted).toBeTruthy();
    expect(body.preview.wordCount).toBeGreaterThan(5);
  });
});

