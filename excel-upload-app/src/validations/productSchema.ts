import { z } from 'zod';

// 商品情報のバリデーションスキーマ
export const productSchema = z.object({
  productCode: z.string().min(1, { message: '商品コードは必須です' }),
  productName: z.string().min(1, { message: '商品名は必須です' }),
  demandQuantity: z.number().int().positive({ message: '需要数は1以上の整数である必要があります' }),
  version: z.string().min(1, { message: 'バージョンは必須です' }),
});

export type Product = z.infer<typeof productSchema>;

// Excelファイルのバリデーション結果の型定義
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  data?: Product[];
}
