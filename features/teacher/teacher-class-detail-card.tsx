"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClassStatusBlock } from "@/features/teacher/class-status-block";
import { ClassAttendancesForm } from "@/features/teacher/class-attendances-form";
import { formatClassDate } from "@/lib/app-timezone";
import type { ClassStatus } from "@/types/database.types";
import type { Student } from "@/types";
import type { AbsenceDetail } from "@/repositories/attendances";

interface TeacherClassDetailCardProps {
  classId: string;
  classTypeName: string;
  classDate: string;
  startTime: string | null;
  durationMinutes: number;
  status: ClassStatus;
  cancellationReason: string | null;
  cancellationReasonType?: string | null;
  cancellationReasonOther?: string | null;
  cancellationReasonObservations?: string | null;
  scope: "individual" | "shared";
  canEdit: boolean;
  students: Student[];
  initialAttendedIds: string[];
  initialAbsentIds: string[];
  absenceDetails: AbsenceDetail[];
}

export function TeacherClassDetailCard({
  classId,
  classTypeName,
  classDate,
  startTime,
  durationMinutes,
  status,
  cancellationReason,
  cancellationReasonType,
  cancellationReasonOther,
  cancellationReasonObservations,
  scope,
  canEdit,
  students,
  initialAttendedIds,
  initialAbsentIds,
  absenceDetails,
}: TeacherClassDetailCardProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{classTypeName}</CardTitle>
          <ClassStatusBlock
            classId={classId}
            status={status}
            cancellationReason={cancellationReason}
            cancellationReasonType={cancellationReasonType}
            cancellationReasonOther={cancellationReasonOther}
            cancellationReasonObservations={cancellationReasonObservations}
            canEdit={canEdit}
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
          />
        </div>
        <CardContent className="pt-0 text-muted-foreground">
          {formatClassDate(classDate, "EEEE d MMMM")}
          {startTime != null && (
            <>
              {" "}
              · {String(startTime).slice(0, 5)} · {durationMinutes} min
            </>
          )}
        </CardContent>
      </CardHeader>
      <CardContent className="space-y-4">
        <ClassAttendancesForm
          classId={classId}
          scope={scope}
          students={students}
          initialAttendedIds={initialAttendedIds}
          initialAbsentIds={initialAbsentIds}
          absenceDetails={absenceDetails}
          canEdit={canEdit}
        />
      </CardContent>
    </Card>
  );
}
