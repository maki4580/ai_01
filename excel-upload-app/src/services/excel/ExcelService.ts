import { Workbook } from 'exceljs';
import { productSchema, ValidationResult, Product } from '@/validations/productSchema';

export class ExcelService {
  /**
   * Excelファイルの拡張子チェックを行う
   */
  static isValidExcelFile(filename: string): boolean {
    return filename.endsWith('.xlsx');
  }

  /**
   * Excelファイルの内容を検証する
   */
  async validateExcelFile(filePath: string): Promise<ValidationResult> {
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return {
          isValid: false,
          errors: ['シートが見つかりません']
        };
      }

      const rows = worksheet.getRows(2, worksheet.rowCount) || []; // 1行目はヘッダーとして扱う
      const products: Product[] = [];
      const errors: string[] = [];

      rows.forEach((row, index) => {
        if (!row?.getCell(1).value) return; // 空行はスキップ

        const rowData = {
          productCode: row.getCell(1).value?.toString() || '',
          productName: row.getCell(2).value?.toString() || '',
          demandQuantity: Number(row.getCell(3).value) || 0,
          version: row.getCell(4).value?.toString() || '',
        };

        try {
          const validatedData = productSchema.parse(rowData);
          products.push(validatedData);
        } catch (error) {
          if (error instanceof Error) {
            errors.push(`${index + 2}行目: ${error.message}`);
          }
        }
      });

      // 商品コードの重複チェック
      const productCodes = new Set<string>();
      products.forEach((product, index) => {
        if (productCodes.has(product.productCode)) {
          errors.push(`${index + 2}行目: 商品コード「${product.productCode}」が重複しています`);
        }
        productCodes.add(product.productCode);
      });

      if (errors.length > 0) {
        return {
          isValid: false,
          errors
        };
      }

      return {
        isValid: true,
        data: products
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Excelファイルの読み込みに失敗しました']
      };
    }
  }
}
