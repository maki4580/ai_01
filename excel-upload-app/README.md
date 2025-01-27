# Excel Upload App

Excelファイルをアップロードし、データを検証するNext.jsアプリケーション

## 技術スタック

- Next.js 15.1.6
- TypeScript
- ExcelJS (Excelファイル処理)
- Zod (データバリデーション)
- Jest (テスト)
- Tailwind CSS

## 機能

### Excelファイルの検証
- `.xlsx`形式のファイルのみ受け付け
- 商品データの検証
  - 商品コード
  - 商品名
  - 需要数量
  - バージョン
- 商品コードの重複チェック

### データ仕様

要件に従って以下のデータを検証：

| 列 | 項目 | 説明 |
|---|---|---|
| A | 商品コード | 必須 |
| B | 商品名 | 必須 |
| C | 需要数量 | 必須、数値 |
| D | バージョン | 必須 |

## テスト

JestとTypeScriptを使用してユニットテストを実装しています。

### テストの実行

```bash
# 単独実行
npm test

# 監視モード
npm run test:watch
```

### テストケース

#### ExcelService

1. isValidExcelFile
   - 正しい拡張子(.xlsx)の場合の検証
   - 不正な拡張子の場合の検証

2. validateExcelFile
   - シートが存在しない場合のエラー検証
   - 正常なデータの検証
   - 商品コードの重複チェック
   - ファイル読み込みエラーの検証

## セットアップ

```bash
# パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番環境での実行
npm start

# リント実行
npm run lint
