import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prismaRead from "@/lib/prisma-read";   // replica
import prismaWrite from "@/lib/prisma-write"; // primary

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SCHOOLADMIN") {
      return NextResponse.json(
        { message: "Only School Admins can create a school" },
        { status: 403 }
      );
    }

    const { name, address, location } = await req.json();

    if (!name || !address || !location) {
      return NextResponse.json(
        { message: "Name, Address, and Location are required" },
        { status: 400 }
      );
    }

    // ✅ READ from replica
    const existingSchool = await prismaRead.school.findFirst({
      where: {
        admins: {
          some: { id: session.user.id },
        },
      },
    });

    if (existingSchool) {
      return NextResponse.json(
        {
          message:
            "You already created a school. You can only update it, not create a new one.",
          school: existingSchool,
        },
        { status: 400 }
      );
    }

    // ✅ WRITE → PRIMARY
    const school = await prismaWrite.school.create({
      data: {
        name,
        address,
        location,
        admins: {
          connect: { id: session.user.id },
        },
      },
    });

    // ⚠️ Immediate read-after-write → PRIMARY
    const freshSchool = await prismaWrite.school.findUnique({
      where: { id: school.id },
      include: { admins: true },
    });

    // ➕ update user's schoolId
    await prismaWrite.user.update({
      where: { id: session.user.id },
      data: { schoolId: freshSchool?.id },
    });

    return NextResponse.json(
      { message: "School created successfully", school: freshSchool },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
