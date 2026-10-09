import { AppHeader } from "@/components/app-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppHeader />
      <main id="main" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
    </>
  );
}
