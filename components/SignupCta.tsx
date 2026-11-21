import Link from "next/link";

export default function SignupCta() {
    return (
        <section className="mx-auto max-w-5xl px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-foreground">
                Ready to try it with your family?
            </h2>
            <p className="mt-2 text-muted"> Set up your family in a few minutes.</p>
            <Link 
            href="/signup"
            className="mt-6 inline-block rounded-control bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover">
                Create a parent account
                </Link>
        </section>
    );
}