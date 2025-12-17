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
    const studentId = searchParams.get("studentId");
    const subject = searchParams.get("subject");

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }

    // For students: only show their own marks
    if (session.user.role === "STUDENT") {
      if (!session.user.studentId) {
        return NextResponse.json(
          { message: "Student record not found" },
          { status: 400 }
        );
      }

      const where: any = {
        studentId: session.user.studentId,
      };

      if (subject) {
        where.subject = subject;
      }

      const marks = await prisma.mark.findMany({
        where,
        include: {
          class: {
            select: { id: true, name: true, section: true },
          },
          teacher: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({ marks }, { status: 200 });
    }

    // For teachers: show marks for all classes in their school
    if (session.user.role === "TEACHER") {
      const where: any = {
        class: {
          schoolId: schoolId,
        },
        // Show marks given by this teacher OR any marks in their school
        // Remove teacherId filter to see all marks in school
      };

      if (classId) {
        where.classId = classId;
      }

      if (studentId) {
        where.studentId = studentId;
      }

      if (subject) {
        where.subject = subject;
      }

      const marks = await prisma.mark.findMany({
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
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({ marks }, { status: 200 });
    }

    // For school admin: show all marks in their school
    if (session.user.role === "SCHOOLADMIN") {
      const where: any = {
        class: {
          schoolId: schoolId,
        },
      };

      if (classId) {
        where.classId = classId;
      }

      if (studentId) {
        where.studentId = studentId;
      }

      if (subject) {
        where.subject = subject;
      }

      const marks = await prisma.mark.findMany({
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
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({ marks }, { status: 200 });
    }

    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  } catch (error: any) {
    console.error("View marks error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
