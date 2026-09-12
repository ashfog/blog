import { cardPose, galleryGeometry, relativePosition, wrap } from "./geometry.mjs";

const ART_SLICE_COUNT = 24;
const ROOM_CORNER_SLICE_COUNT = 12;

class AshfogGallery extends HTMLElement {
  connectedCallback() {
    if (this.dataset.enhanced) return;
    const viewport = this.querySelector<HTMLElement>(".gallery-viewport")!;
    const scene = this.querySelector<HTMLElement>(".gallery-scene")!;
    const cards = Array.from(this.querySelectorAll<HTMLAnchorElement>(".gallery-exhibit"));
    const roomCornerSlices = Array.from(this.querySelectorAll<HTMLElement>(".gallery-room-corner-slice"));
    if (cards.length < 2) return;
    const countLabel = this.querySelector<HTMLElement>("[data-gallery-count]")!;
    const currentLink = this.querySelector<HTMLAnchorElement>("[data-gallery-current]")!;
    const currentMeta = this.querySelector<HTMLElement>("[data-gallery-current-meta]")!;
    const announcement = this.querySelector<HTMLElement>("[data-gallery-announcement]")!;
    const stateLabel = this.querySelector<HTMLElement>("[data-gallery-state]")!;
    const pauseButton = this.querySelector<HTMLButtonElement>("[data-gallery-pause]")!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const abort = new AbortController();
    const { signal } = abort;
    let refreshArtworkLayout = () => {};
    const artworks = cards.map((card) => {
      const art = card.querySelector<HTMLElement>(".gallery-art")!;
      const source = art.querySelector<HTMLImageElement>(":scope > img");
      const caption = card.querySelector<HTMLElement>("figcaption")!;
      if (!source) return { art, source, slices: [] as HTMLElement[], caption, captionSlices: [] as HTMLElement[] };

      art.querySelectorAll(".gallery-art-slice").forEach((slice) => slice.remove());
      card.querySelectorAll(".gallery-caption-slice").forEach((slice) => slice.remove());
      card.dataset.sliced = "true";
      const slices = Array.from({length: ART_SLICE_COUNT}, (_, index) => {
        const slice = document.createElement("span");
        slice.className = "gallery-art-slice";
        if (index === 0) slice.classList.add("gallery-art-slice--first");
        if (index === ART_SLICE_COUNT - 1) slice.classList.add("gallery-art-slice--last");
        slice.dataset.sliceIndex = String(index);
        slice.setAttribute("aria-hidden", "true");
        art.append(slice);
        return slice;
      });
      const captionSlices = Array.from({length: ART_SLICE_COUNT}, (_, index) => {
        const slice = document.createElement("span");
        slice.className = "gallery-caption-slice";
        slice.dataset.sliceIndex = String(index);
        slice.setAttribute("aria-hidden", "true");
        const content = document.createElement("span");
        content.className = "gallery-caption-slice-content";
        Array.from(caption.childNodes).forEach((node) => content.append(node.cloneNode(true)));
        slice.append(content);
        caption.parentElement!.append(slice);
        return slice;
      });
      const syncImage = () => {
        const src = source.currentSrc || source.src;
        if (!src) return;
        const background = `url(${JSON.stringify(src)})`;
        slices.forEach((slice) => { slice.style.backgroundImage = background; });
      };
      source.addEventListener("load", () => {
        syncImage();
        refreshArtworkLayout();
      }, {signal});
      syncImage();
      return { art, source, slices, caption, captionSlices };
    });
    let geometry = galleryGeometry(viewport.clientWidth);
    let position = 0;
    let target: number | null = null;
    let velocity = 0;
    let lastFrame = 0;
    let frame = 0;
    let selected = -1;
    let hovering = false;
    let focused = false;
    let visible = true;
    let manuallyPaused = false;
    let cooldownUntil = 0;
    let pointer: {id:number;x:number;y:number;lastX:number;time:number;dragged:boolean} | null = null;
    let suppressClickUntil = 0;

    const paused = () => manuallyPaused || motion.matches || hovering || focused || !!pointer;
    const sizeRoom = () => {
      geometry = galleryGeometry(viewport.clientWidth);
      scene.style.perspective = `${geometry.perspective}px`;
      scene.style.setProperty("--gallery-world-width", `${geometry.cardWidth}px`);
      scene.style.setProperty("--gallery-world-art-height", `${geometry.artHeight}px`);
      scene.style.setProperty("--gallery-label-scale", String(geometry.labelScale));
      scene.style.setProperty("--gallery-room-width", `${geometry.roomHalfWidth * 2}px`);
      scene.style.setProperty("--gallery-room-back-width", `${geometry.backRun * 2}px`);
      scene.style.setProperty("--gallery-room-height", `${geometry.roomHeight}px`);
      scene.style.setProperty("--gallery-room-side-depth", `${geometry.sideDepth}px`);
      scene.style.setProperty("--gallery-room-back-z", `${-geometry.roomDepth}px`);
      scene.style.setProperty("--gallery-room-side-x", `${geometry.roomHalfWidth}px`);
      scene.style.setProperty("--gallery-room-side-z", `${-geometry.roomDepth + geometry.cornerRadius + geometry.sideDepth / 2}px`);
      scene.style.setProperty("--gallery-room-floor-depth", `${geometry.sideDepth + geometry.cornerRadius}px`);
      scene.style.setProperty("--gallery-room-floor-z", `${-geometry.roomDepth + (geometry.sideDepth + geometry.cornerRadius) / 2}px`);
      scene.style.setProperty("--gallery-room-floor-y", `${geometry.roomHeight / 2}px`);

      const cornerStep = geometry.cornerRun / ROOM_CORNER_SLICE_COUNT;
      const cornerOverlap = Math.max(1, geometry.unit * 1.2);
      roomCornerSlices.forEach((slice) => {
        const side = Number(slice.dataset.roomCornerSide);
        const index = Number(slice.dataset.roomCornerIndex);
        const path = side * (geometry.backRun + (index + .5) * cornerStep);
        const pose = cardPose(path / geometry.slot, geometry);
        const radians = pose.angle * Math.PI / 180;
        const surfaceOffset = 4 * geometry.unit;
        const x = pose.x - Math.sin(radians) * surfaceOffset;
        const z = pose.z - Math.cos(radians) * surfaceOffset;
        slice.style.width = `${cornerStep + cornerOverlap}px`;
        slice.style.height = `${geometry.roomHeight}px`;
        slice.style.transform = `translate(-50%, -50%) translate3d(${x}px,0,${z}px) rotateY(${pose.angle}deg)`;
      });

      const artworkStep = geometry.cardWidth / ART_SLICE_COUNT;
      const artworkOverlap = Math.max(5 * geometry.unit, artworkStep * .4);
      const captionOverlap = Math.max(.75, geometry.unit * .7);
      const captionHeight = (geometry.mobile ? 190 : 230) * geometry.unit;
      artworks.forEach(({source, slices, captionSlices}) => {
        if (!source || !slices.length) return;
        const naturalWidth = source.naturalWidth || Number(source.getAttribute("width")) || geometry.cardWidth;
        const naturalHeight = source.naturalHeight || Number(source.getAttribute("height")) || geometry.artHeight;
        const coverScale = Math.max(geometry.cardWidth / naturalWidth, geometry.artHeight / naturalHeight);
        const imageWidth = naturalWidth * coverScale;
        const imageHeight = naturalHeight * coverScale;
        const imageX = (geometry.cardWidth - imageWidth) / 2;
        const imageY = (geometry.artHeight - imageHeight) / 2;
        slices.forEach((slice, index) => {
          slice.style.width = `${artworkStep + artworkOverlap}px`;
          slice.style.height = `${geometry.artHeight}px`;
          slice.style.backgroundSize = `${imageWidth}px ${imageHeight}px`;
          slice.style.backgroundPosition = `${imageX - index * artworkStep + artworkOverlap / 2}px ${imageY}px`;
        });
        captionSlices.forEach((slice, index) => {
          slice.style.width = `${artworkStep + captionOverlap}px`;
          slice.style.height = `${captionHeight}px`;
          const content = slice.querySelector<HTMLElement>(".gallery-caption-slice-content")!;
          content.style.width = `${geometry.cardWidth}px`;
          content.style.transform = `translateX(${-index * artworkStep + captionOverlap / 2}px)`;
        });
      });
    };
    const updateStatus = () => {
      const text = motion.matches ? "Reduced motion" : manuallyPaused ? "Movement paused" : hovering || focused || pointer ? "Take your time" : "Slowly wandering";
      if (stateLabel.textContent !== text) stateLabel.textContent = text;
      pauseButton.setAttribute("aria-pressed", String(manuallyPaused || motion.matches));
      pauseButton.setAttribute("aria-label", manuallyPaused ? "Resume automatic movement" : "Pause automatic movement");
      pauseButton.disabled = motion.matches;
      pauseButton.innerHTML = manuallyPaused || motion.matches ? '<span aria-hidden="true">▷</span>' : '<span aria-hidden="true">Ⅱ</span>';
    };
    const draw = () => {
      const artworkStep = geometry.cardWidth / ART_SLICE_COUNT;
      cards.forEach((card, index) => {
        const distance = relativePosition(index, position, cards.length);
        const centerPose = cardPose(distance, geometry);
        const artwork = artworks[index];
        const caption = card.querySelector<HTMLElement>("figcaption")!;

        card.tabIndex = -1;
        card.dataset.wall = centerPose.wall;

        if (artwork.slices.length) {
          let anyVisible = false;
          artwork.slices.forEach((slice, sliceIndex) => {
            const localOffset = -geometry.cardWidth / 2 + (sliceIndex + .5) * artworkStep;
            const slicePose = cardPose(distance + localOffset / geometry.slot, geometry);
            slice.style.visibility = slicePose.visible ? "visible" : "hidden";
            slice.dataset.wall = slicePose.wall;
            slice.style.transform = `translate(-50%, -50%) translate3d(${slicePose.x}px,0,${slicePose.z}px) rotateY(${slicePose.angle}deg)`;
            const captionSlice = artwork.captionSlices[sliceIndex];
            captionSlice.style.visibility = slicePose.visible ? "visible" : "hidden";
            captionSlice.dataset.wall = slicePose.wall;
            captionSlice.style.transform = `translate(-50%, 0) translate3d(${slicePose.x}px,${geometry.artHeight / 2 + 12 * geometry.labelScale}px,${slicePose.z}px) rotateY(${slicePose.angle}deg)`;
            anyVisible ||= slicePose.visible;
          });

          card.style.visibility = anyVisible ? "visible" : "hidden";
          card.inert = !anyVisible;
          card.style.transform = "none";
          return;
        }

        card.style.visibility = centerPose.visible ? "visible" : "hidden";
        card.inert = !centerPose.visible;
        caption.style.visibility = "";
        caption.style.transform = "";
        card.style.transform = `translate(-50%, -50%) translate3d(${centerPose.x}px,0,${centerPose.z}px) rotateY(${centerPose.angle}deg)`;
      });
      const index = wrap(Math.round(position), cards.length);
      if (selected === index) return;
      selected = index;
      const card = cards[index];
      const title = card.querySelector(".gallery-exhibit-title")!.textContent!;
      countLabel.textContent = String(index + 1).padStart(2, "0");
      currentLink.href = card.href;
      currentLink.textContent = title;
      currentLink.lang = card.lang;
      currentLink.dir = card.dir;
      currentMeta.textContent = `${card.dataset.category} · ${card.dataset.minutes} min read`;
    };
    refreshArtworkLayout = () => { sizeRoom(); draw(); };
    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) { lastFrame = 0; return; }
      const dt = Math.min((now - (lastFrame || now)) / 1000, 0.05);
      lastFrame = now;
      if (target !== null && !pointer) {
        const difference = target - position;
        position = motion.matches ? target : position + difference * (1 - Math.exp(-10 * dt));
        if (Math.abs(target - position) < .001) { position = target; target = null; }
      } else if (!pointer && Math.abs(velocity) > .006) {
        position += velocity * dt;
        velocity *= Math.exp(-5.5 * dt);
      } else if (!paused() && now > cooldownUntil) {
        position += dt * .095;
      }
      if (target === null) position = wrap(position, cards.length);
      draw();
      if (target !== null || Math.abs(velocity) > .006 || !paused()) frame = requestAnimationFrame(tick);
      else lastFrame = 0;
    };
    const wake = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick); };
    const step = (direction: number) => {
      velocity = 0;
      target = Math.round(target ?? position) + direction;
      cooldownUntil = performance.now() + 4500;
      const card = cards[wrap(Math.round(target), cards.length)];
      announcement.textContent = `${wrap(Math.round(target), cards.length) + 1} of ${cards.length}. ${card.querySelector(".gallery-exhibit-title")!.textContent}`;
      wake();
    };
    viewport.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") { hovering = true; velocity = 0; updateStatus(); } }, {signal});
    viewport.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") { hovering = false; updateStatus(); wake(); } }, {signal});
    this.addEventListener("focusin", () => { focused = !!document.activeElement?.matches(":focus-visible"); if (focused) velocity = 0; updateStatus(); }, {signal});
    this.addEventListener("focusout", () => { queueMicrotask(() => { focused = this.contains(document.activeElement) && !!document.activeElement?.matches(":focus-visible"); updateStatus(); wake(); }); }, {signal});
    viewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); step(event.key === "ArrowRight" ? 1 : -1); }
    }, {signal});
    viewport.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      focused = false;
      pointer = {id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,time:performance.now(),dragged:false};
      velocity = 0; target = null; updateStatus();
    }, {signal});
    viewport.addEventListener("pointermove", (event) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (!pointer.dragged) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { pointer = null; updateStatus(); wake(); return; }
        if (Math.abs(dx) < 6) return;
        pointer.dragged = true;
        viewport.setPointerCapture(event.pointerId);
        this.dataset.dragging = "";
      }
      const now = performance.now();
      const delta = (pointer.lastX - event.clientX) / geometry.spacing;
      position += delta;
      velocity = motion.matches ? 0 : Math.max(-5, Math.min(5, delta / Math.max((now - pointer.time) / 1000, .016)));
      pointer.lastX = event.clientX; pointer.time = now;
      draw();
    }, {signal});
    const release = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      if (pointer.dragged) suppressClickUntil = performance.now() + 400;
      if (event.type === "pointercancel" || performance.now() - pointer.time > 120) velocity = 0;
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      pointer = null; delete this.dataset.dragging;
      cooldownUntil = performance.now() + 4000;
      updateStatus(); wake();
    };
    window.addEventListener("pointerup", release, {signal});
    window.addEventListener("pointercancel", release, {signal});
    viewport.addEventListener("click", (event) => { if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); } }, {capture:true,signal});
    viewport.addEventListener("dragstart", (event) => event.preventDefault(), {signal});
    this.querySelector("[data-gallery-previous]")!.addEventListener("click", () => step(-1), {signal});
    this.querySelector("[data-gallery-next]")!.addEventListener("click", () => step(1), {signal});
    pauseButton.addEventListener("click", () => { manuallyPaused = !manuallyPaused; velocity = 0; target = null; updateStatus(); wake(); }, {signal});
    motion.addEventListener("change", () => { velocity = 0; updateStatus(); wake(); }, {signal});
    cards.forEach((card) => {
      const image = card.querySelector<HTMLImageElement>("img");
      if (!image) return;
      const fallback = () => {
        const src = image.dataset.fallbackSrc;
        if (!src || image.dataset.fallbackUsed) return;
        image.dataset.fallbackUsed = "true";
        image.removeAttribute("srcset");
        image.alt = image.dataset.fallbackAlt ?? "";
        image.src = src;
      };
      image.addEventListener("error", fallback, {signal});
      if (image.complete && image.naturalWidth === 0) fallback();
    });
    document.addEventListener("visibilitychange", () => { lastFrame = 0; wake(); }, {signal});
    const resize = new ResizeObserver(() => { sizeRoom(); draw(); });
    resize.observe(viewport);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; lastFrame = 0; wake(); });
    intersection.observe(viewport);
    this.dataset.enhanced = "";
    this.querySelector<HTMLElement>(".gallery-controls")!.hidden = false;
    sizeRoom(); draw(); updateStatus(); wake();
    this.cleanup = () => {
      abort.abort();
      resize.disconnect();
      intersection.disconnect();
      cancelAnimationFrame(frame);
      artworks.forEach(({slices, captionSlices}) => {
        slices.forEach((slice) => slice.remove());
        captionSlices.forEach((slice) => slice.remove());
      });
      cards.forEach((card) => {
        delete card.dataset.sliced;
        delete card.dataset.wall;
        card.removeAttribute("style");
        card.querySelector<HTMLElement>("figcaption")?.removeAttribute("style");
      });
      delete this.dataset.enhanced;
    };
  }
  cleanup?: () => void;
  disconnectedCallback() { this.cleanup?.(); }
}
if (!customElements.get("ashfog-gallery")) customElements.define("ashfog-gallery", AshfogGallery);

document.querySelector<HTMLButtonElement>("[data-gallery-theme]")?.addEventListener("click", (event) => {
  const dark = document.documentElement.dataset.galleryMode !== "dark";
  document.documentElement.dataset.galleryMode = dark ? "dark" : "light";
  const button = event.currentTarget as HTMLButtonElement;
  button.setAttribute("aria-pressed", String(dark));
  button.setAttribute("aria-label", dark ? "Use light color theme" : "Use dark color theme");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#141414" : "#ffffff");
});
