import PageHeader from "@/components/PageHeader";
import SignupCta from "@/components/SignupCta";

const setupSteps = [
  {
    title: "Create your parent account",
    body: "Sign up with email or Google. Children can't create accounts on their own.",
  },
  {
    title: "Add a profile for each child",
    body: "Give each child their own goals and interests, so the app reflects what they care about.",
  },
  {
    title: "Choose your settings",
    body: "placeholder"
  },
];

const childFeatures = [
  {
    title: "Chat by typing or talking",
    body: "Voice chat works even for kids who aren't confident readers or typists yet.",
  },
  {
    title: "Learn by subject",
    body: "Guided sessions in math, science, and literature, at their own pace.",
  },
  {
    title: "Goals and challenges",
    body: "kids set goals and take on challenges that match their interests.",
  },
  {
    title: "See their progress",
    body: "A simple view of what they've learned and what's next, so they can see themselves grow.",
  },
];

const parentView = [
  "what each child has been talking about",
  "What they're learning and how they're progressing",
  "How much time they spend in the app",
  "Every setting, changeable at any time",
];

export default function HowitWorks() {
  return (
    <main>
      <PageHeader 
        eyebrow="How it works"
        title="Set it up in minutes. Watch them think for themselves."
        intro="Everything starts with a parent. You create the account, set up each child, and stay in charge of how the app is used."
        />

        {/* Parent Setup */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-bold text-foreground">Getting started</h2>
          <p className="mt-2 text-muted">Three steps, all done by you.</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {setupSteps.map((step, i) => (
              <li
                key={step.title}
                className="rounded-card border border-border bg-surface p-6 shadow-card"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
            ))}
          </ol>
        </section>
        
        {/* Child experience*/}
        <section className="border-y border-border bg-surface-muted">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-2xl font-bold text-foreground">
              What your child does
            </h2>
            <p className="mt-2 text-muted">
              Their own space, built around their goals and interests
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {childFeatures.map((feature) => (
                <li
                  key={feature.title}
                  className="rounded-card border border-border bg-surface p-6"
                  >
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {feature.body}
                    </p>
                  </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How the chatbot teaches */}
        <section className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              A chatbot that teaches, not tells
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Most AI tools hand out answers. ThinkFirst is built on good teaching methods: it asks questions, encourages children to explain their reasoning, and guides them toward working things out on their own.
            </p>
            <p className="mt-4 leading-relaxed text-muted">
              It also adapts to each child over time, so no two kids get quite the same experience.
            </p>
          </div>

          {/* Example conversation */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-raised"
          aria-label="Example conversation"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Example conversation
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <p className="max-w-[85%] self-end rounded-card bg-primary px-4 py-2 text-on-primary">
                Why do leaves change color in the fall?
              </p>
              <p className="max-w-[85%] rounded-card bg-surface-muted px-4 py-2 text-foreground">
                Great question! First, what do you think leaves use sunlight for?
              </p>
              <p className="max-w-[85%] self-end rounded-card bg-primary px-4 py-2 text-on-primary">
                to make food?
              </p>
              <p className="max-w-[85%] rounded-card bg-surface-muted px-4 py-2 text-foreground">
                Exactly. So what might happen to a leaf when the days get shorter and there&apos;s less sunlight?
              </p>
            </div>
          </div>
        </section>

        {/* Parent Dashboard */}
        <section className="border-y border-border bg-surface-muted">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-2xl font-bold text-foreground">
              What you see as a parent
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {parentView.map((item) => (
                <li key={item} className="flex gap-3 text-foreground">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
        <SignupCta />
    </main>
  );
}