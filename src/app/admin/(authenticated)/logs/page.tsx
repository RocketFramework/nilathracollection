import LogsDashboard from "./components/LogsDashboard";
import { LoggerService } from "@/services/logger.service";

export const metadata = {
    title: "System Logs | Nilathra Admin",
    description: "View and manage system logs",
};

export default async function LogsPage() {
    const isPageViewLoggingEnabled = await LoggerService.isPageViewLoggingEnabled();

    return <LogsDashboard initialEnabled={isPageViewLoggingEnabled} />;
}
