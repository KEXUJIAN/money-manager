import type { Account } from "@/db"
import { Wallet, CreditCard, Banknote, Smartphone } from "lucide-react"

interface AccountCardProps {
    account: Account
    onClick?: () => void
}

const formatter = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" })

export function AccountCard({ account, onClick }: AccountCardProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'cash': return <Banknote className="h-5 w-5" />;
            case 'bank': return <Wallet className="h-5 w-5" />;
            case 'alipay': return <Smartphone className="h-5 w-5" />;
            case 'wechat': return <Smartphone className="h-5 w-5" />;
            case 'credit_card': return <CreditCard className="h-5 w-5" />;
            default: return <Wallet className="h-5 w-5" />;
        }
    }

    const typeLabels: Record<string, string> = {
        cash: "现金",
        bank: "银行卡",
        alipay: "支付宝",
        wechat: "微信",
        credit_card: "信用卡",
        other: "其他",
    }

    return (
        <div
            className={`account-gradient-${account.type} rounded-xl p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium opacity-90">{account.name}</span>
                <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                    {getIcon(account.type)}
                </div>
            </div>
            <div className="text-2xl font-bold tracking-tight">
                {formatter.format(account.balance)}
            </div>
            <p className="text-xs opacity-70 mt-1">
                {typeLabels[account.type] || account.type}
            </p>
        </div>
    )
}
