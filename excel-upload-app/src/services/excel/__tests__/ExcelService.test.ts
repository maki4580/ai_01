import { ExcelService } from '../ExcelService';
import { Workbook } from 'exceljs';
import { Product } from '@/validations/productSchema';

// ExcelJSのモック
jest.mock('exceljs', () => ({
  Workbook: jest.fn().mockImplementation(() => ({
    xlsx: {
      readFile: jest.fn()
    },
    worksheets: []
  }))
}));

describe('ExcelService', () => {
  describe('isValidExcelFile', () => {
    it('正しい拡張子(.xlsx)の場合はtrueを返す', () => {
      expect(ExcelService.isValidExcelFile('test.xlsx')).toBe(true);
    });

    it('不正な拡張子の場合はfalseを返す', () => {
      expect(ExcelService.isValidExcelFile('test.xls')).toBe(false);
      expect(ExcelService.isValidExcelFile('test.csv')).toBe(false);
      expect(ExcelService.isValidExcelFile('test.txt')).toBe(false);
    });
  });

  describe('validateExcelFile', () => {
    let excelService: ExcelService;
    let mockWorkbook: jest.Mocked<Workbook>;

    beforeEach(() => {
      jest.clearAllMocks();
      excelService = new ExcelService();
      mockWorkbook = new Workbook() as jest.Mocked<Workbook>;
      (Workbook as jest.Mock).mockImplementation(() => mockWorkbook);
    });

    it('シートが存在しない場合はエラーを返す', async () => {
      mockWorkbook.worksheets = [];
      const result = await excelService.validateExcelFile('test.xlsx');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('シートが見つかりません');
    });

    it('正常なデータの場合は検証に成功する', async () => {
      const mockRows = [
        {
          getCell: (col: number) => ({
            value: col === 1 ? 'CODE1'
              : col === 2 ? '商品1'
                : col === 3 ? 10
                  : 'v1'
          })
        }
      ];

      const mockWorksheet = {
        rowCount: 2,
        getRows: () => mockRows,
        id: 1,
        name: 'Sheet1',
        workbook: mockWorkbook,
        hasMerges: false
      } as unknown as import('exceljs').Worksheet;
      mockWorkbook.worksheets = [mockWorksheet];
      await mockWorkbook.xlsx.readFile('test.xlsx');

      const result = await excelService.validateExcelFile('test.xlsx');

      expect(result.isValid).toBe(true);
      expect((result.data as Product[])[0]).toEqual({
        productCode: 'CODE1',
        productName: '商品1',
        demandQuantity: 10,
        version: 'v1'
      });
    });

    it('商品コードが重複している場合はエラーを返す', async () => {
      const mockRows = [
        {
          getCell: (col: number) => ({
            value: col === 1 ? 'CODE1'
              : col === 2 ? '商品1'
                : col === 3 ? 10
                  : 'v1'
          })
        },
        {
          getCell: (col: number) => ({
            value: col === 1 ? 'CODE1'
              : col === 2 ? '商品2'
                : col === 3 ? 20
                  : 'v2'
          })
        }
      ];

      const mockWorksheet = {
        rowCount: 3,
        getRows: () => mockRows,
        id: 1,
        name: 'Sheet1',
        workbook: mockWorkbook,
        hasMerges: false
      } as unknown as import('exceljs').Worksheet;
      mockWorkbook.worksheets = [mockWorksheet];
      await mockWorkbook.xlsx.readFile('test.xlsx');

      const result = await excelService.validateExcelFile('test.xlsx');

      expect(result.isValid).toBe(false);
      expect(result.errors?.[0]).toContain('商品コード「CODE1」が重複しています');
    });

    it('Excelファイルの読み込みに失敗した場合はエラーを返す', async () => {
      (mockWorkbook.xlsx.readFile as jest.Mock).mockRejectedValue(new Error('読み込みエラー'));

      const result = await excelService.validateExcelFile('test.xlsx');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Excelファイルの読み込みに失敗しました');
    });
  });
});
