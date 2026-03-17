import Link from "next/link";
import { getPeriods } from "@/repositories/periods";
import { PeriodsTable } from "@/features/admin/periods-table";
import { CreatePeriodDialog } from "@/features/admin/create-period-dialog";
import { ChevronLeft } from "lucide-react";

export default async function AdminPeriodsPage() {
  const periods = await getPeriods();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Breadcrumb">
          <Link
            href="/admin"
            className="inline-flex items-center text-[13px] text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Admin
          </Link>
        </nav>
        <h1 className="text-lg font-semibold tracking-tight">Períodos</h1>
      </div>
      <div className="flex justify-end">
        <CreatePeriodDialog />
      </div>
      <PeriodsTable periods={periods} />
    </div>
  );
}
