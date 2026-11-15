import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { UserService } from "@/services/user.service";

export default async function AdminNewLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/admin/login");
    }

    const roles = await UserService.resolveUserRoles(user.id);
    const hasStaffAccess = roles.some((r) => r !== "tourist");

    // Tourists strictly only have access to the Tourist Portal (/tourist)
    if (!hasStaffAccess) {
        redirect("/tourist");
    }

    return <>{children}</>;
}

