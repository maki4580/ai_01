import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';
import { ExcelService } from '@/services/excel/ExcelService';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import path from 'path';
import { ValidationResult } from '@/validations/productSchema';

// すべてのモックを先に宣言
jest.mock('next/server');
jest.mock('@/services/excel/ExcelService');
jest.mock('fs');
jest.mock('fs/promises');

const nextJson = jest.fn().mockImplementation((data, options) => ({
  ...data,
  status: options?.status || 200,
  json: async () => data
}));

(NextResponse as jest.Mocked<typeof NextResponse>).json = nextJson;

// fsのモック設定
// モックの作成
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
const mockExistsSync = jest.fn().mockReturnValue(true);
const mockMkdirSync = jest.fn().mockReturnValue(undefined);
const mockUnlinkSync = jest.fn().mockImplementation(() => undefined);

// モックの設定
jest.spyOn(fsPromises, 'writeFile').mockImplementation(mockWriteFile);
jest.spyOn(fs, 'existsSync').mockImplementation(mockExistsSync);
jest.spyOn(fs, 'mkdirSync').mockImplementation(mockMkdirSync);
jest.spyOn(fs, 'unlinkSync').mockImplementation(mockUnlinkSync);

describe('POST /api/upload', () => {
  let mockValidateExcelFile: jest.Mock;
  const mockIsValidExcelFile = jest.spyOn(ExcelService, 'isValidExcelFile');

  const createFormData = (file?: File) => {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    return formData;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateExcelFile = jest.fn().mockResolvedValue({ isValid: true, data: [] });
    (ExcelService as jest.MockedClass<typeof ExcelService>).mockImplementation(() => ({
      validateExcelFile: mockValidateExcelFile
    }));
    mockIsValidExcelFile.mockReturnValue(true);
  });

  it('ファイルがアップロードされていない場合は400エラーを返す', async () => {
    const request = {
      formData: () => Promise.resolve(createFormData())
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ファイルがアップロードされていません');
  });

  it('不正な拡張子のファイルの場合は400エラーを返す', async () => {
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    const formData = createFormData(file);
    const request = {
      formData: () => Promise.resolve(formData)
    } as unknown as NextRequest;

    mockIsValidExcelFile.mockReturnValue(false);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('有効なExcelファイル(.xlsx)ではありません');
  });

  it('ExcelServiceの検証でエラーの場合は400エラーを返す', async () => {
    const file = new File(['test content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const formData = createFormData(file);
    const request = {
      formData: () => Promise.resolve(formData)
    } as unknown as NextRequest;

    mockIsValidExcelFile.mockReturnValue(true);
    mockValidateExcelFile.mockResolvedValue({
      isValid: false,
      errors: ['データが不正です', '商品コードが重複しています']
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('データが不正です\n商品コードが重複しています');
  });

  it('正常にアップロードと検証が成功する場合は200を返す', async () => {
    const file = new File(['test content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const formData = createFormData(file);
    const request = {
      formData: () => Promise.resolve(formData)
    } as unknown as NextRequest;

    mockIsValidExcelFile.mockReturnValue(true);
    mockValidateExcelFile.mockResolvedValue({
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
    const formData = createFormData(file);
    const request = {
      formData: () => Promise.resolve(formData)
    } as unknown as NextRequest;

    mockIsValidExcelFile.mockReturnValue(true);
    mockWriteFile.mockRejectedValue(new Error('ファイル書き込みエラー'));

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('ファイルのアップロードに失敗しました');
  });
});
