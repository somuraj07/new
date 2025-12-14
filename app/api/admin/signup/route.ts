import prismaRead from "@/lib/prisma-read";
import prismaWrite from "@/lib/prisma-write";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "Missing parameters" },
        { status: 400 }
      );
    }

    // ✅ READ → REPLICA
    const existing = await prismaRead.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    // ✅ WRITE → PRIMARY
    const user = await prismaWrite.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
      },
    });

    // ⚠️ Read-after-write MUST use PRIMARY
    const freshUser = await prismaWrite.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ user: freshUser }, { status: 201 });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error in signup route" },
      { status: 500 }
    );
  }
}
