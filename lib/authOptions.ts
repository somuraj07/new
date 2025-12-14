import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prismaWrite from "@/lib/prisma-write"; // primary
// import prismaRead from "@/lib/prisma-read"; // optional for replica
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prismaWrite), // always primary

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // For login, read from primary to avoid replica lag
        const user = await prismaWrite.user.findUnique({
          where: { email: credentials.email },
          include: { student: true, assignedClasses: true, school: true },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          mobile: user.mobile,
          studentId: user.student?.id || null,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.mobile = user.mobile;
        token.studentId = user.studentId;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        role: token.role as "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT",
        schoolId: token.schoolId as string | null,
        mobile: token.mobile as string | null,
        studentId: token.studentId as string | null,
      };
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
