import Navbar from "@/components/Navbar";

export default function WebsiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-8 text-sm text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} ThinkFirst</p>
          <p>A learning companion that asks before it answers.</p>
        </div>
      </footer>
    </div>
  );
}