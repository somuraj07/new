import RequireRole from "@/components/RequireRole";
import TeacherLeavesPage from "@/components/teacherleave";

export default function TeacherLeavesPages() {
  return (
    <RequireRole allowedRoles={["TEACHER"]}>
          <TeacherLeavesPage />
    </RequireRole>
  );
}