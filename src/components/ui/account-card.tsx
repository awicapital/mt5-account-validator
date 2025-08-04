import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AccountCardProps = {
  account: {
    account_number: string;
    ea_name?: string;
    balance: number;
    is_active: boolean;
    pnl_total?: number | null; // adicionado campo para PNL total
  };
  showControls?: boolean;
  onToggle?: () => void;
  className?: string;
};

export function AccountCard({
  account,
  showControls = false,
  onToggle,
  className,
}: AccountCardProps) {
  const formatCurrency = (value: number | null | undefined) =>
    typeof value === "number" ? `R$ ${value.toFixed(2)}` : "—";

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
          <div>
            <p className="text-muted-foreground">EA:</p>
            <p>{account.ea_name || "—"}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Saldo:</p>
            <p>{formatCurrency(account.balance)}</p>
          </div>

          <div>
            <p className="text-muted-foreground">PNL total:</p>
            <p
              className={
                account.pnl_total !== null && account.pnl_total !== undefined
                  ? account.pnl_total > 0
                    ? "text-green-500"
                    : "text-red-500"
                  : "text-muted-foreground"
              }
            >
              {account.pnl_total !== null && account.pnl_total !== undefined
                ? `${account.pnl_total > 0 ? "+" : ""}${account.pnl_total.toFixed(2)}`
                : "—"}
            </p>
          </div>
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
