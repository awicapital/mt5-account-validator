import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AccountCardProps = {
  account: {
    account_number: string;
    ea_name?: string;
    balance: number;
    is_active: boolean;
  };
  showControls?: boolean;
  onToggle?: () => void;
  className?: string; // adicionada prop className opcional
};

export function AccountCard({
  account,
  showControls = false,
  onToggle,
  className,
}: AccountCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-medium text-muted-foreground">
            Conta #{account.account_number}
          </h4>
          <Badge
            className={
              account.is_active
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }
          >
            {account.is_active ? "Ativa" : "Inativa"}
          </Badge>
        </div>

        <div className="text-sm space-y-1">
          <p className="text-muted-foreground">EA:</p>
          <p>{account.ea_name || "—"}</p>

          <p className="text-muted-foreground">Saldo:</p>
          <p>
            {typeof account.balance === "number"
              ? `R$ ${account.balance.toFixed(2)}`
              : "—"}
          </p>
        </div>

        {showControls && onToggle && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={onToggle}
          >
            {account.is_active ? "Desativar" : "Ativar"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
