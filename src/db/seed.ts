import { db } from "./index";
import { v4 as uuidv4 } from "uuid";

export const seedDatabase = async () => {
    const count = await db.accounts.count();
    if (count > 0) return;

    // Default Accounts
    await db.accounts.bulkAdd([
        {
            id: uuidv4(),
            name: "Cash",
            type: "cash",
            balance: 0,
            currency: "CNY",
            icon: "wallet",
            color: "green",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            id: uuidv4(),
            name: "Alipay",
            type: "alipay",
            balance: 0,
            currency: "CNY",
            icon: "alipay",
            color: "blue",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
    ]);

    // Default Categories
    await db.categories.bulkAdd([
        { id: uuidv4(), name: "Food", type: "expense", icon: "utensils", createdAt: Date.now(), updatedAt: Date.now() },
        { id: uuidv4(), name: "Transport", type: "expense", icon: "bus", createdAt: Date.now(), updatedAt: Date.now() },
        { id: uuidv4(), name: "Salary", type: "income", icon: "briefcase", createdAt: Date.now(), updatedAt: Date.now() },
    ]);
};
