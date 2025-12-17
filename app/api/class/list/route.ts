import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }

    const where: any = {
      schoolId: schoolId,
    };

    // For teachers: show all classes in their school (not just assigned ones)
    // This allows flexibility - teachers can work with any class in their school
    // If you want to restrict to only assigned classes, uncomment the line below:
    // if (session.user.role === "TEACHER") {
    //   where.teacherId = session.user.id;
    // }

    const classes = await prisma.class.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add teacherId to each class for frontend filtering
    const classesWithTeacherId = classes.map((c) => ({
      ...c,
      teacherId: c.teacher?.id || null,
    }));

    return NextResponse.json({ classes: classesWithTeacherId }, { status: 200 });
  } catch (error: any) {
    console.error("List classes error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
