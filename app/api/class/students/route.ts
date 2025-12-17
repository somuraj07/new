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

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }

    // For teachers: get students from classes in their school
    if (session.user.role === "TEACHER") {
      const where: any = {
        schoolId: schoolId,
      };

      if (classId) {
        // Verify class belongs to teacher's school (not necessarily assigned to teacher)
        const classData = await prisma.class.findFirst({
          where: {
            id: classId,
            schoolId: schoolId,
          },
        });

        if (!classData) {
          return NextResponse.json(
            { message: "Class not found or doesn't belong to your school" },
            { status: 404 }
          );
        }

        where.classId = classId;
      }
      // If no classId, show all students in teacher's school

      const students = await prisma.student.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          class: {
            select: { id: true, name: true, section: true },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return NextResponse.json({ students }, { status: 200 });
    }

    // For school admin: get all students or filter by class
    if (session.user.role === "SCHOOLADMIN") {
      const where: any = {
        schoolId: schoolId,
      };

      if (classId) {
        where.classId = classId;
      }

      const students = await prisma.student.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          class: {
            select: { id: true, name: true, section: true },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return NextResponse.json({ students }, { status: 200 });
    }

    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  } catch (error: any) {
    console.error("Get class students error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
