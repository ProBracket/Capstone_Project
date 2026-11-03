import Navbar from "@/components/Navbar";

export default function WebsiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div>
        <Navbar />
            {children}
    </div>
  );
}