import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const date = searchParams.get("date");
    const studentId = searchParams.get("studentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }

    // For students: only show their own attendance
    if (session.user.role === "STUDENT") {
      if (!session.user.studentId) {
        return NextResponse.json(
          { message: "Student record not found" },
          { status: 400 }
        );
      }

      const student = await prisma.student.findUnique({
        where: { id: session.user.studentId },
      });

      if (!student) {
        return NextResponse.json(
          { message: "Student not found" },
          { status: 404 }
        );
      }

      const where: any = {
        studentId: student.id,
      };

      if (date) {
        const dateObj = new Date(date);
        where.date = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      }

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      const attendances = await prisma.attendance.findMany({
        where,
        include: {
          class: {
            select: { id: true, name: true, section: true },
          },
          teacher: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [
          { date: "desc" },
          { period: "asc" },
        ],
      });

      return NextResponse.json({ attendances }, { status: 200 });
    }

    // For teachers: show attendance for all classes in their school
    if (session.user.role === "TEACHER") {
      const where: any = {
        class: {
          schoolId: schoolId,
        },
        // Show attendance marked by this teacher OR any attendance in their school
        // Remove teacherId filter to see all attendance in school
      };

      if (classId) {
        where.classId = classId;
      }

      if (date) {
        const dateObj = new Date(date);
        where.date = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      }

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      if (studentId) {
        where.studentId = studentId;
      }

      const attendances = await prisma.attendance.findMany({
        where,
        include: {
          student: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          class: {
            select: { id: true, name: true, section: true },
          },
        },
        orderBy: [
          { date: "desc" },
          { period: "asc" },
        ],
      });

      return NextResponse.json({ attendances }, { status: 200 });
    }

    // For school admin: show all attendance in their school
    if (session.user.role === "SCHOOLADMIN") {
      const where: any = {
        class: {
          schoolId: schoolId,
        },
      };

      if (classId) {
        where.classId = classId;
      }

      if (date) {
        const dateObj = new Date(date);
        where.date = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      }

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      if (studentId) {
        where.studentId = studentId;
      }

      const attendances = await prisma.attendance.findMany({
        where,
        include: {
          student: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          class: {
            select: { id: true, name: true, section: true },
          },
          teacher: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [
          { date: "desc" },
          { period: "asc" },
        ],
      });

      return NextResponse.json({ attendances }, { status: 200 });
    }

    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  } catch (error: any) {
    console.error("View attendance error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
