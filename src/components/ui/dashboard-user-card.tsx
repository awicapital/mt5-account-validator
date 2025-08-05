import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Hourglass } from "lucide-react";

interface DashboardUserCardProps {
  name?: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  activeCount?: number;
  pendingCount?: number;
}

function getInitials(name: string | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
    : `${parts[0][0] ?? ""}`.toUpperCase();
}

export function DashboardUserCard({
  name,
  email,
  role,
  avatarUrl,
  activeCount = 0,
  pendingCount = 0,
}: DashboardUserCardProps) {
  return (
    <Card className="bg-[#0f172a] border border-[#1e2b45] rounded-2xl shadow-md text-white">
      <CardContent className="flex items-center justify-between p-6 gap-6 flex-wrap">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1e2b45] flex items-center justify-center text-white text-xl font-bold">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(name)
            )}
          </div>

          <div className="flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2 text-lg font-semibold leading-tight">
              <span>{name || "Sem nome"}</span>
              {role && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-[#0f172a] text-[#60a5fa] font-medium border border-[#1e2b45]">
                  {role}
                </span>
              )}
            </div>

            <div className="text-sm text-muted-foreground leading-tight">
              {email}
            </div>

            <div className="flex gap-3 mt-3">
              <div className="flex items-center gap-2 text-sm bg-[#13203a] px-3 py-1 rounded-md border border-[#1e2b45]">
                <BadgeCheck size={16} className="text-green-400" />
                {activeCount} conta{activeCount !== 1 && "s"} ativa{activeCount !== 1 && "s"}
              </div>
              <div className="flex items-center gap-2 text-sm bg-[#13203a] px-3 py-1 rounded-md border border-[#1e2b45]">
                <Hourglass size={16} className="text-yellow-400" />
                {pendingCount} conta{pendingCount !== 1 && "s"} pendente{pendingCount !== 1 && "s"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
