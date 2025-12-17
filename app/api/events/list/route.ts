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
    const teacherId = searchParams.get("teacherId");

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

    // For students: show events for their class
    if (session.user.role === "STUDENT") {
      if (!session.user.studentId) {
        return NextResponse.json(
          { message: "Student record not found" },
          { status: 400 }
        );
      }

      const student = await prisma.student.findUnique({
        where: { id: session.user.studentId },
        select: { classId: true },
      });

      if (student?.classId) {
        where.OR = [
          { classId: student.classId },
          { classId: null }, // School-wide events
        ];
      } else {
        where.classId = null; // Only school-wide events
      }
    }

    // For teachers: show all events in their school (their own + school-wide + any class events)
    if (session.user.role === "TEACHER") {
      if (teacherId && teacherId === session.user.id) {
        where.teacherId = session.user.id;
      }
      // Otherwise, show all events in the school (no additional filtering needed)
    }

    if (classId) {
      where.classId = classId;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        class: {
          select: { id: true, name: true, section: true },
        },
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // For students, also include registration status
    if (session.user.role === "STUDENT" && session.user.studentId) {
      const eventsWithRegistration = await Promise.all(
        events.map(async (event) => {
          const registration = await prisma.eventRegistration.findUnique({
            where: {
              eventId_studentId: {
                eventId: event.id,
                studentId: session.user.studentId!,
              },
            },
          });

          return {
            ...event,
            isRegistered: !!registration,
            registrationStatus: registration?.paymentStatus || null,
          };
        })
      );

      return NextResponse.json({ events: eventsWithRegistration }, { status: 200 });
    }

    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error("List events error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
