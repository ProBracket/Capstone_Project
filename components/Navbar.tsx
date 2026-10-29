import Link from "next/link";

export default function Navbar() {
  return (
    <nav>
      <Link href="/homepage">Home</Link> |{" "}
      <Link href="/how-it-works">How It Works</Link> |{" "}
      <Link href="/about">About</Link> | <Link href="/login">Login</Link>
    </nav>
  );
}
