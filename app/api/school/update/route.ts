import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prismaWrite from "@/lib/prisma-write"; // ✅ use primary for writes

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { name, address, location } = await req.json();

    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "SCHOOLADMIN")
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // Read user's schoolId from primary (optional: read from replica if acceptable)
    const user = await prismaWrite.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.schoolId) {
      return NextResponse.json(
        { message: "You have not created a school yet" },
        { status: 400 }
      );
    }

    // ✅ UPDATE school on primary
    const updated = await prismaWrite.school.update({
      where: { id: user.schoolId },
      data: { name, address, location },
    });

    return NextResponse.json(
      { message: "School updated", updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("School update error:", error);
    return NextResponse.json(
      { message: "Error updating school" },
      { status: 500 }
    );
  }
}
