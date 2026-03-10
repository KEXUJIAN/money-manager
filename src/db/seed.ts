import { db } from "./index";
import { generateId } from "@/lib/utils";

// 用户提供的完整分类列表
const expenseCategories = [
    "餐饮", "借款", "通讯", "购物", "steam", "果蔬", "住房", "日常",
    "交通", "还款", "娱乐", "基金", "日用", "旅行", "办公", "医疗",
    "学习", "发红包", "美容", "书籍", "其他", "捐款", "运动", "股票",
    "红包", "贷款", "收入", "报销", "定金", "理财", "保险",
];

const incomeCategories = [
    "餐饮", "还款", "理财", "工资", "其他", "通讯", "收红包", "购物",
    "报销", "住房", "steam", "退款", "交通", "礼金", "基金", "医疗",
    "娱乐", "办公", "日用", "美容", "果蔬", "书籍", "借款", "红包",
    "股票", "旅行", "贷款",
];

export const seedDatabase = async () => {
    const count = await db.accounts.count();
    if (count > 0) return;

    const now = Date.now();

    // 默认账户（仅创建一个，用户可自行添加更多）
    await db.accounts.add({
        id: generateId(),
        name: "默认账户",
        type: "cash",
        balance: 0,
        currency: "CNY",
        icon: "wallet",
        color: "green",
        createdAt: now,
        updatedAt: now,
    });

    // 支出分类（内置，不可删除）
    const expenseCats = expenseCategories.map((name) => ({
        id: `builtin_expense_${name}`,
        name,
        type: "expense" as const,
        isBuiltin: true,
        createdAt: now,
        updatedAt: now,
    }));

    // 收入分类（内置，不可删除）
    const incomeCats = incomeCategories.map((name) => ({
        id: `builtin_income_${name}`,
        name,
        type: "income" as const,
        isBuiltin: true,
        createdAt: now,
        updatedAt: now,
    }));

    // 1. 【自愈机制】扫除数据库里所有旧版（由于以前 Bug 遗留的）带随机 ID 的残余伪内置分类
    const legacyZombies = await db.categories
        .filter(c => !!c.isBuiltin && !c.id.startsWith("builtin_"))
        .primaryKeys();

    if (legacyZombies.length > 0) {
        console.warn("🧹 发现遗留的随机 ID 内置分类，正在进行自动清理...");
        await db.categories.bulkDelete(legacyZombies);
    }

    // 2. 【防战损写入】使用 bulkPut（存在即覆盖更新记录），永远消灭重置冲突导致的 ConstraintError!
    await db.categories.bulkPut([...expenseCats, ...incomeCats]);
};
