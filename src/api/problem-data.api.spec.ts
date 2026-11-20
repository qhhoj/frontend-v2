import { describe, expect, it } from 'vitest';
import { problemData } from '@/test/admin-fixtures/problems';
import { mockApi, ok } from '@/test/mock-api';
import { uploadDataSource } from './problem-data.api';

describe('uploadDataSource', () => {
  it('posts the file as the multipart `file` field to the route of its kind', async () => {
    const calls = mockApi({
      'POST /problems/sum/data/files/customChecker': ok(
        problemData({ customChecker: 'checker.cpp' }),
      ),
    });
    const file = new File(['int main(){}'], 'checker.cpp');
    const saved = await uploadDataSource('sum', 'customChecker', file);
    expect(saved.customChecker).toBe('checker.cpp');
    expect(calls).toHaveLength(1);
    const sent = (calls[0].body as FormData).get('file') as File;
    expect(sent.name).toBe('checker.cpp');
  });
});
