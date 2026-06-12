export default function AboutSection({ id, badge, title, children, className = '' }) {
  return (
    <section id={id} className={`about-section animate-fade-in ${className}`}>
      <div className="about-section__inner">
        {badge && <span className="about-badge">{badge}</span>}
        {title && <h2 className="about-section__title">{title}</h2>}
        <div className="about-section__content">{children}</div>
      </div>
    </section>
  );
}
