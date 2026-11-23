import Link from "next/link";

const features = [
  {
    title: "Parents stay in control",
    body: "Create a profile for each child and manage consent, microphone permissions, account and security from one dashboard.",
  },
  {
    title: "Type or talk",
    body: "Children can chat by typing or by voice, so it works even for kids who aren't confident readers or typists yet.",
  },
  {
    title: "Questions, not answers",
    body: "The chatbot asks questions and guides children to think things through, building critical thinking instead of handing out facts",
  },
];

const steps = [
  "A parent creates an account.",
  "They set up a profile for each child, with their security controls.",
  "The child starts chatting with a companion that adapts to them over time.",
];

export default function Homepage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 sm:pt-28">
        <p className="text-sm font-semibold text-primary">
          For kids, guided by parents
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold text-foreground sm:text-5xl">
          A learning companion that asks before it answers.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          ThinkFirst is a chatbot kids can talk to. Instead of giving away answers, it asks questions and help them work things out for themselves.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup"
          className="rounded-control bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
          >
            Get started
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-control border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              See how it works
            </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <ul className="grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-card border border-border bg-surface p-6 shadow-card">
                <h2 className="text-base font-semibold text-foreground">
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.body}
                </p>
              </li>
          ))}
        </ul>
      </section>

      {/* How it starts */}
      <section className="border-y border-border bg-surface-muted">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-bold text-foreground">How it starts</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
                  {i + 1}
                </span>
                <p className="pt-1 text-sm leading-relaxed text-foreground">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
