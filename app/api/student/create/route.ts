import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@/app/generated/prisma";

export async function POST(req: Request) {
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

    const { name, email, fatherName, aadhaarNo, phoneNo, dob, classId, address } =
      await req.json();

    // Validate all required fields
    if (!name || !dob || !fatherName || !aadhaarNo || !phoneNo) {
      return NextResponse.json(
        { message: "Missing required fields: name, dob, fatherName, aadhaarNo, and phoneNo are required" },
        { status: 400 }
      );
    }

    // DOB as default password YYYYMMDD
    const dobDate = new Date(dob);
    const password = dobDate.toISOString().split("T")[0].replace(/-/g, "");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use transaction with timeout (10 seconds) and isolation level
    const student = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: Role.STUDENT,
            schoolId,
          },
        });

        const student = await tx.student.create({
          data: {
            userId: user.id,
            schoolId,
            classId: classId ?? null,
            dob: dobDate,
            address,
            fatherName,
            aadhaarNo,
            phoneNo,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
            class: true,
          },
        });

        return student;
      },
      {
        maxWait: 10000, // Maximum time to wait for a transaction slot (10 seconds)
        timeout: 20000, // Maximum time the transaction can run (20 seconds)
      }
    );

    return NextResponse.json(
      { message: "Student created under your school", student },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Student creation error:", error);
    
    // Handle transaction timeout errors
    if (error?.code === "P1008" || error?.message?.includes("transaction") || error?.message?.includes("timeout")) {
      return NextResponse.json(
        { message: "Transaction timeout. Please try again." },
        { status: 408 }
      );
    }
    
    // Handle Prisma unique constraint violations
    if (error?.code === "P2002") {
      const field = error?.meta?.target?.[0];
      if (field === "email") {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 400 }
        );
      }
      if (field === "aadhaarNo") {
        return NextResponse.json(
          { message: "Aadhaar number already exists" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
