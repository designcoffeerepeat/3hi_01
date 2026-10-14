/** Live local time for the Los Angeles and New York studios. */
export function initClocks() {
  const els = [...document.querySelectorAll('[data-clock]')];
  const formatters = new Map(
    els.map((el) => [
      el,
      new Intl.DateTimeFormat('en-US', {
        timeZone: el.dataset.clock,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    ])
  );
  const tick = () => {
    const now = new Date();
    formatters.forEach((fmt, el) => (el.textContent = fmt.format(now)));
  };
  tick();
  setInterval(tick, 10000);
  document
    .querySelectorAll('[data-year]')
    .forEach((el) => (el.textContent = new Date().getFullYear()));
}
