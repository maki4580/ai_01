import { NextRequest, NextResponse } from 'next/server';
import { ExcelService } from '@/services/excel/ExcelService';
import path from 'path';
import fs from 'fs';
import { ValidationResult } from '@/validations/productSchema';
import { writeFile } from 'fs/promises';

const uploadDir = path.join(process.cwd(), 'uploads');
const tmpDir = path.join(process.cwd(), 'tmp');

// ディレクトリが存在しない場合は作成
[uploadDir, tmpDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルがアップロードされていません' },
        { status: 400 }
      );
    }

    // 拡張子チェック
    if (!ExcelService.isValidExcelFile(file.name)) {
      return NextResponse.json(
        { error: '有効なExcelファイル(.xlsx)ではありません' },
        { status: 400 }
      );
    }

    // アップロードされたファイルを一時保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tmpFilePath = path.join(tmpDir, file.name);
    await writeFile(tmpFilePath, buffer);

    // Excelファイルの検証
    const excelService = new ExcelService();
    const validationResult: ValidationResult = await excelService.validateExcelFile(tmpFilePath);

    // 一時ファイルを削除
    fs.unlinkSync(tmpFilePath);

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.errors?.join('\n') },
        { status: 400 }
      );
    }

    // 検証に成功した場合、uploadsディレクトリに移動
    const uploadFilePath = path.join(uploadDir, file.name);
    await writeFile(uploadFilePath, buffer);

    return NextResponse.json({
      success: true,
      data: validationResult.data,
    });

  } catch (error) {
    console.error('ファイルアップロードエラー:', error);
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
  }
}
