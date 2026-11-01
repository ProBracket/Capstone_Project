import Link from "next/link";

export default function Homepage() {
  return (
    <main>
      <h1>ThinkFirst</h1>
      <p>
        ThinkFirst is a learning companion for kids that they can talk to. Parents
        log in, create a profile for each child, and stay in control through a
        dashboard and settings for consent, voice permissions, the chatbot, and
        time usage. Each child gets their own goals and interests, and can chat
        by typing or by voice with a personalized chatbot that adapts to them.
        The chatbot is built around good teaching: rather than handing out
        answers, it asks questions and guides children to think things through
        for themselves.
      </p>
      <Link href="/login">Login</Link>
    </main>
  );
}
