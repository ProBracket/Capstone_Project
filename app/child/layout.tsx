/** Wraps every /child page: nothing shows until Supabase says which child is playing. */
import ActiveChildProvider from "./ActiveChildProvider";

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  return <ActiveChildProvider>{children}</ActiveChildProvider>;
}
