import { Card, CardContent } from "@/components/ui/card";

interface Account {
  id: string;
  account_number: string;
  balance: number | null;
  ea_name?: string;
  is_active: boolean;
}

interface UserCardProps {
  userName?: string;
  email: string;
  accounts: Account[];
}

export function UserCard({ userName, email, accounts }: UserCardProps) {
  const activeCount = accounts.filter((a) => a.is_active).length;
  const pendingCount = accounts.filter((a) => !a.is_active).length;

  return (
    <Card className="bg-[#03182f] border-[#1e2b45] text-white">
      <CardContent className="p-4 space-y-1 text-sm">
        <p className="font-semibold text-base">
          {userName?.trim() || email}
        </p>
        <div className="flex gap-4 text-xs pt-1">
          <span className="text-green-400">{activeCount} conta(s) ativa(s)</span>
          {pendingCount > 0 && (
            <span className="text-yellow-400">{pendingCount} pendente(s)</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
