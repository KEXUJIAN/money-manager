import Dexie, { type EntityTable } from 'dexie';

export interface Account {
  id: string; // UUID
  name: string;
  type: 'cash' | 'bank' | 'alipay' | 'wechat' | 'credit_card' | 'other';
  balance: number;
  balanceOffset?: number; // 历史平账偏置值
  currency: string;
  icon?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string; // UUID
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  isBuiltin?: boolean; // WHY: 区分内置分类（不可删除）和用户自定义分类
  parentId?: string; // For nested categories
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string; // UUID
  amount: number; // Always positive
  type: 'income' | 'expense' | 'transfer';
  accountId: string; // 转出方（或默认归属账号）
  transferToAccountId?: string; // 转入方（仅转账型存在）
  categoryId?: string;
  date: number; // Timestamp
  note?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

const db = new Dexie('MoneyManagerDB') as Dexie & {
  accounts: EntityTable<Account, 'id'>;
  categories: EntityTable<Category, 'id'>;
  transactions: EntityTable<Transaction, 'id'>;
};

// Schema definition
db.version(1).stores({
  accounts: 'id, type, name',
  categories: 'id, type, name, parentId',
  transactions: 'id, date, type, accountId, transferToAccountId, categoryId, [date+type]' // Composite index for reporting
});

export { db };
