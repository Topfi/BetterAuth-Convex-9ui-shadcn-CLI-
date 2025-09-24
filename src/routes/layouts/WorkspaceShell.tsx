import { Outlet } from "react-router-dom";

export default function WorkspaceShell() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col transition-colors">
      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
