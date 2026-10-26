import { AppHeader } from "@/components/app-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <main id="main" className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
