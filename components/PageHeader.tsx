type PageHeaderProps = {
    eyebrow: string;
    title: string;
    intro: string;
};

export default function PageHeader({ eyebrow, title, intro}: PageHeaderProps) {
    return (
        <header className="border-b border-border bg-surface-muted">
            <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
                <p className="text-sm font-semibold text-primary">{eyebrow}</p>
                <h1 className="mt-3 max-w-2xl text-4xl font-bold text-foreground sm:text-5xl">
                    {title}
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                    {intro}
                </p>
            </div>
        </header>
    );
}