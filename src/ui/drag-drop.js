import { WORDS } from '../words.js';
import { $, cardMeta, rarityClass, playingCardFace, preserveFocus } from './dom.js';

export function initDragDrop(ctx) {
  let drag = null;

  document.addEventListener('pointerdown', event => {
    if (ctx.getBusy() || drag || event.button !== 0) return;
    if (event.target.closest('[data-remove-slot]')) return;
    const handle = event.target.closest('[data-drag-word], [data-drag-slot]');
    if (!handle || handle.disabled) return;
    const from = handle.dataset.dragSlot === undefined ? null : Number(handle.dataset.dragSlot);
    if (event.pointerType === 'touch' && from === null && !handle.classList.contains('drag-handle')) return;
    const words = ctx.getWords();
    const id = from === null ? handle.dataset.dragWord : words[from];
    if (!id || !WORDS[id]) return;
    event.preventDefault();
    drag = { pointerId: event.pointerId, from, id, handle, startX: event.clientX, startY: event.clientY, ghost: null, statusEl: null };
    try { handle.setPointerCapture(event.pointerId); } catch { /* Synthetic pointer events may not support capture */ }
  });

  document.addEventListener('pointermove', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.ghost && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    if (!drag.ghost) {
      const word = WORDS[drag.id];
      const meta = cardMeta(drag.id);
      drag.ghost = document.createElement('div');
      drag.ghost.className = `drag-ghost playing-card word-${drag.id} ${rarityClass(word)} ${meta.roleClass}`;
      drag.ghost.innerHTML = `${playingCardFace(ctx.getState(), drag.id)}<div class="drag-ghost-status"></div>`;
      drag.statusEl = drag.ghost.querySelector('.drag-ghost-status');
      document.body.append(drag.ghost);
      drag.handle.closest('.word-item, .spell-slot')?.classList.add('dragging-source');
      document.body.classList.add('is-dragging');
    }
    drag.ghost.style.transform = `translate(${event.clientX - 64}px, ${event.clientY - 88}px) rotate(-4deg) scale(1.04)`;
    document.querySelectorAll('.drop-hover').forEach(el => {
      el.classList.remove('drop-hover');
      delete el.dataset.dragPreview;
    });
    $('word-bank')?.classList.remove('drop-return-hover');
    $('spell-slots')?.classList.remove('drop-zone-active');
    const hovered = document.elementFromPoint(event.clientX, event.clientY);
    const slotEl = hovered?.closest('[data-slot]');
    const inSlotsArea = hovered?.closest('#spell-slots');
    if (slotEl) {
      slotEl.classList.add('drop-hover');
      slotEl.dataset.dragPreview = WORDS[drag.id].label;
      const slotIdx = Number(slotEl.dataset.slot);
      const slotNum = slotIdx + 1;
      drag.ghost.classList.remove('will-remove');
      if (drag.statusEl) {
        drag.statusEl.textContent = drag.from === null ? `วางในช่องที่ ${slotNum}` : drag.from === slotIdx ? `อยู่ช่องที่ ${slotNum}` : `สลับไปช่องที่ ${slotNum}`;
      }
    } else if (inSlotsArea) {
      $('spell-slots')?.classList.add('drop-zone-active');
      drag.ghost.classList.remove('will-remove');
      if (drag.statusEl) drag.statusEl.textContent = 'วางต่อท้ายในแท่นคาถา';
    } else if (drag.from !== null) {
      $('word-bank')?.classList.add('drop-return-hover');
      drag.ghost.classList.add('will-remove');
      if (drag.statusEl) drag.statusEl.textContent = `ปล่อยเพื่อถอด “${WORDS[drag.id].label}” กลับมือ`;
    } else {
      $('spell-slots')?.classList.add('drop-zone-active');
      drag.ghost.classList.remove('will-remove');
      if (drag.statusEl) drag.statusEl.textContent = 'ลากไปวางในช่องคาถา 1–4 ด้านบน';
    }
  });

  function endDrag(event, cancelled = false) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag;
    drag = null;
    const hovered = !cancelled && current.ghost ? document.elementFromPoint(event.clientX, event.clientY) : null;
    const destination = hovered?.closest('[data-slot]');
    const inSlotsArea = hovered?.closest('#spell-slots');
    current.ghost?.remove();
    current.handle.closest('.word-item, .spell-slot')?.classList.remove('dragging-source');
    document.body.classList.remove('is-dragging');
    document.querySelectorAll('.drop-hover, .slot-preview-hover').forEach(el => {
      el.classList.remove('drop-hover', 'slot-preview-hover');
      delete el.dataset.dragPreview;
    });
    $('word-bank')?.classList.remove('drop-return-hover');
    $('spell-slots')?.classList.remove('drop-zone-active');
    ctx.setSuppressNextClick(true);
    setTimeout(() => { ctx.setSuppressNextClick(false); }, 0);
    if (!cancelled && !current.ghost) {
      if (current.from === null) ctx.addWord(current.id);
      else {
        ctx.setSelectedSlot(current.from);
        ctx.describeWord(current.id);
        preserveFocus(ctx.renderBattle);
      }
      return;
    }
    if (cancelled) return;
    if (destination) {
      const index = Number(destination.dataset.slot);
      if (current.from === null) ctx.addWord(current.id, index);
      else {
        const words = ctx.getWords();
        const [word] = words.splice(current.from, 1);
        const at = Math.min(index, words.length);
        words.splice(at, 0, word);
        ctx.setSelectedSlot(at);
        ctx.audio.play('place');
        preserveFocus(ctx.renderBattle);
      }
      return;
    }
    if (inSlotsArea && current.from === null) {
      ctx.addWord(current.id, ctx.getWords().length);
      return;
    }
    if (current.from !== null && !inSlotsArea) {
      ctx.removeSlotAt(current.from);
    }
  }

  document.addEventListener('pointerup', event => endDrag(event));
  document.addEventListener('pointercancel', event => endDrag(event, true));
}
