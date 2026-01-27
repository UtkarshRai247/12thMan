export interface CursorData {
  createdAt: string; // ISO string
  id: string;
}

export function encodeCursor(data: CursorData): string {
  const json = JSON.stringify(data);
  return Buffer.from(json).toString('base64');
}

export function decodeCursor(cursor: string): CursorData | null {
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf-8');
    const data = JSON.parse(json) as CursorData;
    if (typeof data.createdAt === 'string' && typeof data.id === 'string') {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
