import CloakReveal from "@/components/CloakReveal";

const examples = [
  "Measured text splits into real rendered lines, then reveals each line in sequence.",
  "Block mode works for buttons, panels, images, or any child content.",
  "Reduced-motion users get the final state without animation.",
];

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">React animation component</p>
        <CloakReveal
          as="h1"
          text="CloakReveal makes text enter like a masked editorial headline."
          className="hero-title"
        />
        <CloakReveal delay={250} className="hero-copy">
          <p>
            The component measures text wraps, groups words into lines, and animates each
            line from behind a clipped wrapper. It can also reveal arbitrary child content
            as a single block.
          </p>
        </CloakReveal>
        <CloakReveal delay={420}>
          <a className="button" href="https://vercel.com/new" target="_blank" rel="noreferrer">
            Deploy on Vercel
          </a>
        </CloakReveal>
      </section>

      <section className="examples" aria-label="Examples">
        {examples.map((item, index) => (
          <article className="example-card" key={item}>
            <span className="example-index">{String(index + 1).padStart(2, "0")}</span>
            <CloakReveal
              as="h2"
              text={item}
              className="example-title"
              sequenceIndex={index}
              sequenceStep={140}
              animationStartDelay={100}
            />
          </article>
        ))}
      </section>
    </main>
  );
}
