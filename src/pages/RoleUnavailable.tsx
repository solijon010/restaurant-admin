import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  AFITSANT: "Ofitsiant",
  SUPER_AFITSANT: "Katta ofitsiant",
  CHEF: "Oshxona",
  KASSA: "Kassir",
};

export default function RoleUnavailable() {
  const { user, logout } = useAuth();

  const roleLabel = useMemo(() => {
    if (!user?.role) return "Bu rol";
    return ROLE_LABELS[user.role] ?? user.role;
  }, [user?.role]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg border-border/70 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Bu panel hali ulanmagan</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {roleLabel} uchun yo'naltirish bor, lekin [app] ichida unga mos route va sahifalar hali
          qo'shilmagan. Shu sabab `/waiter`, `/kitchen` yoki `/cashier` ochilganda 404 chiqayotgan edi.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Hozir faqat `SUPERADMIN` va `MANAGER` panellari to'liq route qilingan.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/login">Login sahifasiga o'tish</Link>
          </Button>
          {user && (
            <Button
              type="button"
              variant="outline"
              onClick={() => logout()}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sessiyani tozalash
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
