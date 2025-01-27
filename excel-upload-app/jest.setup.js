// FormDataのモック
global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }

  append(key, value) {
    this.data.set(key, value);
  }

  get(key) {
    return this.data.get(key);
  }
};

// Fileクラスのモック
global.File = class File {
  constructor(bits, name, options = {}) {
    this.name = name;
    this.type = options.type || '';
    this.size = bits.length;
    this._bits = bits;
  }

  async arrayBuffer() {
    return new ArrayBuffer(this._bits.length);
  }
};

// Blobのモック
global.Blob = class Blob {
  constructor(content, options = {}) {
    this.content = content;
    this.type = options.type || '';
  }
};

// fetch-mockの設定
require('jest-fetch-mock').enableMocks();
