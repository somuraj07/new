import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prismaRead from "@/lib/prisma-read"; // use replica for reads

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized", school: null },
      { status: 401 }
    );
  }

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    return NextResponse.json({ school: null }, { status: 200 });
  }

  // ✅ READ from replica
  const school = await prismaRead.school.findUnique({
    where: { id: schoolId },
  });

  return NextResponse.json({ school }, { status: 200 });
}
