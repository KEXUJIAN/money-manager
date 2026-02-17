import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Account } from "@/db"
import { Wallet, CreditCard, Banknote } from "lucide-react"

interface AccountCardProps {
    account: Account
    onClick?: () => void
}

export function AccountCard({ account, onClick }: AccountCardProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'cash': return <Banknote className="h-5 w-5" />;
            case 'bank': return <Wallet className="h-5 w-5" />; // Using Wallet for generic bank for now
            case 'alipay': return <div className="font-bold text-xs">Zh</div>; // Placeholder
            case 'wechat': return <div className="font-bold text-xs">Wx</div>;
            default: return <CreditCard className="h-5 w-5" />;
        }
    }

    return (
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {account.name}
                </CardTitle>
                <div className={`p-2 rounded-full bg-${account.color}-100 dark:bg-${account.color}-900`}>
                    {getIcon(account.type)}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('zh-CN', { style: 'currency', currency: account.currency }).format(account.balance)}
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                    {account.type}
                </p>
            </CardContent>
        </Card>
    )
}
