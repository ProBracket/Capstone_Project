import PageHeader from "@/components/PageHeader";
import SignupCta from "@/components/SignupCta";

const sections = [
    {
        title: "Your child's profile",
        points: [
            "Only a parent can create a child's profile.",
            "The profiles under the Authenticated parent's email are restricted within the account, therefore different users cannot see other parent's child profiles. "
        ],
    },
    {
        title: "How the chatbot behaves",
        points: [
            "It keeps conversation on learning and your child's interests.",
            "It uses age-appropriate language and avoids unsafe topics.",
            "It never asks for personal details like a home address or sensitive information",
            "If a child brings up something serious, it encourages them to talk to a trusted adult.",
        ],
    },
    {
        title: "what you control",
        points: [
            "Give or withdraw consent at any time.",
            "Turn voice chat on or off for each child",
            "Review your child's history through a transcript."
        ],
    },
];

export default function Safety() {
    return (
        <main>
            <PageHeader
            eyebrow="Safety & Privacy"
            title="Built for kids. Controlled by parents."
            intro="Before your child types a single word, you devide how the conversation flow works for them."
            />
            <section className="mx-auto max-w-5xl px-6 py-16">
                <div className="grid gap-4 md:grid-cols-2">
                    {sections.map((section) => (
                        <article
                        key={section.title}
                        className="rounded-card border border-border bg-surface p-6 shadow-card"
                        >
                            <h2 className="text-lg font-semibold text-foreground">
                                {section.title}
                            </h2>
                            <ul className="mt-4 flex flex-col gap-3">
                                {section.points.map((point) => (
                                    <li 
                                    key={point}
                                    className="flex gap-3 text-sm leading-relaxed text-muted"
                                    >
                                        <span className="mt-0.5 font-bold text-success" aria-hidden>
                                            ✓
                                        </span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>
            <SignupCta />
        </main>
    );
}