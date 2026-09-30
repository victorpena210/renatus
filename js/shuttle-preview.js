/* Local examples only; never substitutes for an organization's service status. */
(() => {
  const states = {
    running: { label: 'Service running', heading: ['Yes.', 'We’re moving.'], detail: 'The shuttle is running. Check your organization’s pickup locations before heading out.' },
    paused: { label: 'Service paused', heading: ['A short pause.', 'Check back soon.'], detail: 'Service is temporarily paused. Your organization’s status page will show operational updates.' },
    stopped: { label: 'Off duty', heading: ['Not right now.', 'We’re off duty.'], detail: 'Shuttle service is not currently running. Check with your organization for planned service windows.' }
  };
  document.querySelectorAll('[data-shuttle-preview]').forEach(preview => {
    const controls = preview.querySelector('.shuttle-preview-controls');
    const card = preview.querySelector('.shuttle-status-card');
    if (!controls || !card) return;
    controls.hidden = false;
    controls.addEventListener('click', event => {
      const button = event.target.closest('[data-shuttle-state]');
      if (!button || !controls.contains(button)) return;
      const state = states[button.dataset.shuttleState];
      if (!state) return;
      card.dataset.state = button.dataset.shuttleState;
      preview.querySelector('[data-shuttle-label]').textContent = state.label;
      const heading = preview.querySelector('[data-shuttle-heading]');
      heading.replaceChildren(document.createTextNode(state.heading[0]), document.createElement('br'), document.createTextNode(state.heading[1]));
      preview.querySelector('[data-shuttle-detail]').textContent = state.detail;
      controls.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    });
  });
})();
