import PageHeader from "@/components/PageHeader";
import SignupCta from "@/components/SignupCta";

const principles = [
  {
    title: "Thinking over answers",
    body: "Getting an answer takes seconds. Understanding why takes practice. We built for the second one.",
  },
  {
    title: "Parents in charge",
    body: "Nothing about a child's account happens without a parent setting it up first.",
  },
  {
    title: "Safe by default",
    body: "No strangers, no ads, and a chatbot designed for kids from the ground up.",
  },
];

// CHECK: replace with your real team names and roles
const team = [
  { name: "Gael Reballos", role: "Information Tech. Services" },
  { name: "Laura Zlatunic", role: "Information Tech. Services" },
  { name: "Muhammad Omar", role: "Information Tech. Services" },
  { name: "Stanley Okoye", role: "Information Tech. Services" },
  {name: "Darryl Juneau", role: "Information Tech. Services"},
  {name: "Keith Payuran", role: "Information Tech. Services"},
];

export default function About() {
  return (
    <main>
      <PageHeader
        eyebrow="About ThinkFirst"
        title="We want kids to think first, and look it up second."
        intro="ThinkFirst started as a capstone project with one question: what if an AI helped children learn to think, instead of thinking for them?"
      />

      {/* Story */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-2xl font-bold text-foreground">Why we built it</h2>
        <div className="mt-4 flex flex-col gap-4 leading-relaxed text-muted">
          <p>
            AI tools are everywhere, and kids are using them. Most of them are
            built to answer as fast as possible. That&apos;s great for adults
            in a hurry, but it can skip the part where a child actually learns.
          </p>
          <p>
            We wanted something different: a companion that asks good
            questions, waits for a child to try, and celebrates the moment they
            figure it out. And because it&apos;s for kids, we wanted parents to
            stay in control the whole way through.
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="border-y border-border bg-surface-muted">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-bold text-foreground">What we believe</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {principles.map((p) => (
              <li
                key={p.title}
                className="rounded-card border border-border bg-surface p-6"
              >
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-bold text-foreground">The team</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, i) => (
            <li
              key={i}
              className="rounded-card border border-border bg-surface p-6 text-center shadow-card"
            >
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-soft text-xl font-semibold text-primary">
                {member.name.charAt(0)}
              </div>
              <p className="mt-4 font-semibold text-foreground">{member.name}</p>
              <p className="text-sm text-muted">{member.role}</p>
            </li>
          ))}
        </ul>
      </section>

      <SignupCta />
    </main>
  );
}