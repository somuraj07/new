import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SCHOOLADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found in session" },
        { status: 400 }
      );
    }

    const teachers = await prisma.user.findMany({
      where: {
        schoolId: schoolId,
        role: "TEACHER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ teachers }, { status: 200 });
  } catch (error: any) {
    console.error("List teachers error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
