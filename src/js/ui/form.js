/*
  Contact form.
  Set VITE_FORM_ENDPOINT (for example a Formspree, Basin or your own API URL) in a
  .env file to POST submissions as JSON. Without it, the form opens a pre-filled
  email to info@3h-i.com so nothing is lost.
*/
const ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT;
const EMAIL = 'info@3h-i.com';

export function initForm() {
  const form = document.querySelector('[data-form]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');

  // "get my free audit" style links pre-select a topic
  document.querySelectorAll('[data-topic]').forEach((link) => {
    link.addEventListener('click', () => {
      const input = form.querySelector(`[data-topic-input="${link.dataset.topic}"]`);
      if (input) input.checked = true;
    });
  });

  const setStatus = (text, isError = false) => {
    status.textContent = text;
    status.classList.toggle('is-error', isError);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

    form.name.setAttribute('aria-invalid', String(!name));
    form.email.setAttribute('aria-invalid', String(!emailOk));
    if (!name || !emailOk) {
      setStatus('please add your name and a valid email.', true);
      (!name ? form.name : form.email).focus();
      return;
    }

    const payload = {
      name,
      email,
      company: String(data.get('company') || ''),
      website: String(data.get('website') || ''),
      topics: data.getAll('topic'),
      message: String(data.get('message') || ''),
    };

    if (ENDPOINT) {
      setStatus('sending...');
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        setStatus('thank you. we will be in touch within one business day.');
      } catch {
        setStatus(`something went wrong. please email ${EMAIL}.`, true);
      }
      return;
    }

    const body = [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Company: ${payload.company}`,
      `Website: ${payload.website}`,
      `Interested in: ${payload.topics.join(', ')}`,
      '',
      payload.message,
    ].join('\n');
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
      `New project inquiry from ${payload.name}`
    )}&body=${encodeURIComponent(body)}`;
    setStatus('your email app should open with everything filled in.');
  });
}
