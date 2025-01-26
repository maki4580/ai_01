'use client';

import { useState } from 'react';
import { Product } from '@/validations/productSchema';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('ファイルを選択してください');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      setProducts(result.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Excel商品情報アップローダー</h1>

      <div className="mb-8">
        <div className="flex gap-4 items-center mb-4">
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="border-2 border-gray-400 p-2 rounded text-gray-900"
          />
          <button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className={`px-4 py-2 rounded ${!file || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            {isLoading ? '処理中...' : 'アップロード'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {products.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-gray-200">
                <th className="border-2 border-gray-400 px-4 py-2 text-gray-900">商品コード</th>
                <th className="border-2 border-gray-400 px-4 py-2 text-gray-900">商品名</th>
                <th className="border-2 border-gray-400 px-4 py-2 text-gray-900">需要数</th>
                <th className="border-2 border-gray-400 px-4 py-2 text-gray-900">バージョン</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="border-2 border-gray-400 px-4 py-2 text-gray-900">{product.productCode}</td>
                  <td className="border-2 border-gray-400 px-4 py-2 text-gray-900">{product.productName}</td>
                  <td className="border-2 border-gray-400 px-4 py-2 text-gray-900">{product.demandQuantity}</td>
                  <td className="border-2 border-gray-400 px-4 py-2 text-gray-900">{product.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
