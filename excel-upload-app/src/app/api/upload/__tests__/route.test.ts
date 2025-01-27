import { NextRequest } from 'next/server';
import { POST } from '../route';
import { ExcelService } from '@/services/excel/ExcelService';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import path from 'path';

// ExcelServiceのモック
jest.mock('@/services/excel/ExcelService', () => {
  return {
    ExcelService: jest.fn().mockImplementation(() => ({
      validateExcelFile: jest.fn()
    })),
    isValidExcelFile: jest.fn()
  };
});

// fsのモック
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

// fs/promisesのモック
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
}));

describe('POST /api/upload', () => {
  let mockFormData: FormData;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormData = new FormData();

    // ディレクトリ存在チェックのモック
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  it('ファイルがアップロードされていない場合は400エラーを返す', async () => {
    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: mockFormData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ファイルがアップロードされていません');
  });

  it('不正な拡張子のファイルの場合は400エラーを返す', async () => {
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    mockFormData.append('file', file);

    (ExcelService.isValidExcelFile as jest.Mock).mockReturnValue(false);

    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: mockFormData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('有効なExcelファイル(.xlsx)ではありません');
  });

  it('ExcelServiceの検証でエラーの場合は400エラーを返す', async () => {
    const file = new File(['test content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    mockFormData.append('file', file);

    (ExcelService.isValidExcelFile as jest.Mock).mockReturnValue(true);
    const mockExcelService = new ExcelService();
    (mockExcelService.validateExcelFile as jest.Mock).mockResolvedValue({
      isValid: false,
      errors: ['データが不正です', '商品コードが重複しています']
    });

    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: mockFormData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('データが不正です\n商品コードが重複しています');
  });

  it('正常にアップロードと検証が成功する場合は200を返す', async () => {
    const file = new File(['test content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    mockFormData.append('file', file);

    (ExcelService.isValidExcelFile as jest.Mock).mockReturnValue(true);
    const mockExcelService = new ExcelService();
    (mockExcelService.validateExcelFile as jest.Mock).mockResolvedValue({
      isValid: true,
      data: [
        {
          productCode: 'CODE1',
          productName: '商品1',
          demandQuantity: 10,
          version: 'v1'
        }
      ]
    });

    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: mockFormData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0]).toEqual({
      productCode: 'CODE1',
      productName: '商品1',
      demandQuantity: 10,
      version: 'v1'
    });
  });

  it('ファイル処理でエラーが発生する場合は500エラーを返す', async () => {
    const file = new File(['test content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    mockFormData.append('file', file);

    (ExcelService.isValidExcelFile as jest.Mock).mockReturnValue(true);
    (fsPromises.writeFile as jest.Mock).mockRejectedValue(new Error('ファイル書き込みエラー'));

    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: mockFormData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('ファイルのアップロードに失敗しました');
  });
});
