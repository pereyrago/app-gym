import { describe, it, expect } from "vitest";
import {
  buildTeacherLiquidationRows,
  groupAttendancesByClassId,
  pickStudentDisplayName,
  normalizeStudentEmbed,
  calculateReportMetrics,
  type TeacherReportClassInput,
} from "./teacher-report";

describe("calculateReportMetrics", () => {
  it("calcula métricas correctamente para un conjunto mixto de clases", () => {
    const classes: TeacherReportClassInput[] = [
      {
        classTypeName: "Yoga",
        class_date: "2025-05-01",
        duration_minutes: 60,
        attendancesCount: 2,
        studentNames: ["Ana", "Beto"],
        status: "success",
      },
      {
        classTypeName: "Yoga",
        class_date: "2025-05-02",
        duration_minutes: 90,
        attendancesCount: 3,
        studentNames: ["Ana", "Carlos", "Dora"],
        status: "success",
      },
      {
        classTypeName: "Yoga",
        class_date: "2025-05-03",
        duration_minutes: 60,
        attendancesCount: 1,
        studentNames: ["Beto"],
        status: "cancel_by_student",
      },
      {
        classTypeName: "Yoga",
        class_date: "2025-05-04",
        duration_minutes: 60,
        attendancesCount: 0,
        studentNames: [],
        status: "cancel_by_teacher",
      },
    ];

    const metrics = calculateReportMetrics(classes);

    expect(metrics.workedHours).toBe(2.5); // (60 + 90) / 60
    expect(metrics.classesTaught).toBe(2);
    expect(metrics.uniqueStudents).toBe(4); // Ana, Beto, Carlos, Dora
    expect(metrics.totalAttendances).toBe(5); // 2 + 3
    expect(metrics.cancelledClasses).toBe(2);
    expect(metrics.avgStudentsPerClass).toBe(2.5); // 5 / 2
  });

  it("devuelve ceros si no hay clases", () => {
    const metrics = calculateReportMetrics([]);
    expect(metrics.workedHours).toBe(0);
    expect(metrics.classesTaught).toBe(0);
    expect(metrics.uniqueStudents).toBe(0);
    expect(metrics.totalAttendances).toBe(0);
    expect(metrics.cancelledClasses).toBe(0);
    expect(metrics.avgStudentsPerClass).toBe(0);
  });
});

describe("pickStudentDisplayName", () => {
  it("prefiere full_name sobre email", () => {
    expect(
      pickStudentDisplayName({
        full_name: "Ana García",
        email: "ana@test.com",
        status: "active",
        deleted_at: null,
      })
    ).toBe("Ana García");
  });

  it("usa email si no hay nombre", () => {
    expect(
      pickStudentDisplayName({
        full_name: "",
        email: "ana@test.com",
        status: "active",
        deleted_at: null,
      })
    ).toBe("ana@test.com");
  });
});

describe("groupAttendancesByClassId", () => {
  it("agrupa nombres activos por clase y ordena", () => {
    const map = groupAttendancesByClassId([
      {
        class_id: "c1",
        students: { full_name: "Zoe", email: null, status: "active", deleted_at: null },
      },
      {
        class_id: "c1",
        students: { full_name: "Ana", email: null, status: "active", deleted_at: null },
      },
      {
        class_id: "c2",
        students: { full_name: "Luis", email: null, status: "active", deleted_at: null },
      },
      {
        class_id: "c1",
        students: { full_name: "Borrado", email: null, status: "active", deleted_at: "2025-01-01" },
      },
      {
        class_id: "c1",
        students: { full_name: "Inactivo", email: null, status: "rejected", deleted_at: null },
      },
    ]);
    expect(map.get("c1")).toEqual(["Ana", "Zoe"]);
    expect(map.get("c2")).toEqual(["Luis"]);
  });

  it("tolera students como array", () => {
    const map = groupAttendancesByClassId([
      {
        class_id: "c1",
        students: [{ full_name: "María", email: null, status: "active", deleted_at: null }],
      },
    ]);
    expect(map.get("c1")).toEqual(["María"]);
  });
});

describe("buildTeacherLiquidationRows", () => {
  it("acumula total de alumnos por grupo (10 clases x 2 = 20)", () => {
    const classes = Array.from({ length: 10 }, (_, i) => ({
      classTypeName: "Funcional",
      class_date: `2025-04-${String(i + 1).padStart(2, "0")}`,
      duration_minutes: 60,
      attendancesCount: 2,
      studentNames: ["A", "B"],
    }));

    const rows = buildTeacherLiquidationRows(classes, {
      group2StudentMultiplier: 0.75,
      group3StudentMultiplier: 0.5,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: "Funcional",
      qty: 10,
      totalAlumnos: 20,
      label: "Grupal (2) x 60m",
    });
    expect(rows[0].total).toBe(10 * 2 * 0.75);
  });
});

describe("normalizeStudentEmbed", () => {
  it("devuelve null para valores inválidos", () => {
    expect(normalizeStudentEmbed(null)).toBeNull();
    expect(normalizeStudentEmbed([])).toBeNull();
  });
});