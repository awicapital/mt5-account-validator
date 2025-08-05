import { Card, CardContent } from "@/components/ui/card";

interface DashboardUserCardProps {
  name?: string;
  email: string;
  role?: string;
  avatarUrl?: string;
}

function getInitials(name: string | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
    : `${parts[0][0] ?? ""}`.toUpperCase();
}

export function DashboardUserCard({ name, email, role, avatarUrl }: DashboardUserCardProps) {
  return (
    <Card className="border border-[#1f2c44] text-white">
      <CardContent className="flex items-center space-x-6 p-6">
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
        <div className="flex flex-col gap-1 justify-center">
          <div className="text-lg font-semibold leading-tight">
            {name || "Sem nome"}
          </div>
          <div className="text-sm text-muted-foreground leading-tight">
            {email}
          </div>
          {role && (
            <div className="mt-2 text-center text-xs px-3 py-1 rounded-md bg-[#0f172a] text-[#60a5fa] font-medium border border-[#1e2b45] self-start">
              {role}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}