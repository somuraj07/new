import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "TEACHER") {
    return NextResponse.json(
      { message: "Only teachers can approve appointments" },
      { status: 403 }
    );
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
    });

    if (!appointment) {
      return NextResponse.json(
        { message: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appointment.teacherId !== session.user.id) {
      return NextResponse.json(
        { message: "You are not the teacher for this appointment" },
        { status: 403 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: "APPROVED" },
    });

    return NextResponse.json(
      { message: "Appointment approved", appointment: updated },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Approve appointment error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}


