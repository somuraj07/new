import NewsFeedPage from "@/components/NewsFeed";
import RequireRole from "@/components/RequireRole";

export default function NewsFeedPages() {
  return (
    <RequireRole allowedRoles={["TEACHER" , "SCHOOLADMIN"]}>
          <NewsFeedPage />
    </RequireRole>
  );
}