// scripts/core/state/categories-ui/sheet-rename-logic.js

export function bindRenameLogic(root, theme, staticEl, staticWrap, inputEl, inputWrap, editBtn) {
  if (editBtn) {
    if (theme === "income") editBtn.classList.add("ff-pen-btn--income");
    if (theme === "expense") editBtn.classList.add("ff-pen-btn--expense");
  }

  let isEditing = false;

  // Zorg dat pen/prullenbak nooit "half-hidden" blijven hangen na rename-mode.
  const restoreStaticActions = () => {
    const nodes = [];

    if (staticWrap) {
      // Alles binnen de static row dat een actie kan zijn (pen/prullenbak/buttons/role=button)
      staticWrap.querySelectorAll(
        ".ff-cat-name-row__pen, .ff-cat-name-row__trash, button, [role='button'], [data-action]"
      ).forEach((n) => nodes.push(n));
    }

    if (editBtn) nodes.push(editBtn);

    // Dubbels eruit
    const uniq = Array.from(new Set(nodes));

    uniq.forEach((el) => {
      try {
        // Herstel zichtbaarheid (voor het geval er inline styles bleven staan)
        el.style.display = "";
        el.style.visibility = "";
        el.style.opacity = "";
        el.style.pointerEvents = "";

        // Herstel toegankelijkheid (geen aria-hidden op gefocuste/klikbare items)
        el.removeAttribute("aria-hidden");

        // Herstel tab-focus indien hij op -1 was gezet
        if (el.getAttribute("tabindex") === "-1") el.removeAttribute("tabindex");
      } catch (_) {}
    });
  };

  const hasInlineErrorNow = () => {
    try {
      const errBox = root.querySelector("#catNameError");
      const ariaInvalid = inputEl && inputEl.getAttribute("aria-invalid") === "true";
      const errVisible = !!(errBox && String(errBox.style.display || "").toLowerCase() !== "none");
      return !!(ariaInvalid || errVisible);
    } catch (_) {
      return false;
    }
  };

  const focusNameInput = () => {
    if (!inputEl) return;
    const focus = () => {
      try {
        inputEl.focus({ preventScroll: true });
        const len = String(inputEl.value || "").length;
        if (typeof inputEl.setSelectionRange === "function") {
          inputEl.setSelectionRange(len, len);
        }
      } catch (_) {}
    };

    // iOS: focus moet zoveel mogelijk binnen de user-gesture blijven.
    focus();
    requestAnimationFrame(focus);
  };

  const setEditing = (on) => {
    isEditing = !!on;

    root.classList.toggle("ff-cat-name-editing", !!on);
    if (inputWrap) inputWrap.style.display = on ? "block" : "none";
    if (staticWrap) staticWrap.style.display = on ? "none" : "flex";

    // Als we teruggaan naar static mode: altijd actions herstellen
    if (!on) {
      restoreStaticActions();
    }

    // Sommige sheets (zoals Sparen -> Bewerken) willen expliciet GEEN autofocus.
    // Zet dan: root.dataset.ffNoAutofocusName = "1" voordat bindRenameLogic wordt aangeroepen.
    const noAutofocus = !!(root && root.dataset && root.dataset.ffNoAutofocusName === "1");
    if (on && inputEl && !noAutofocus) {
      focusNameInput();
    }
  };


  root.__ffCatSetNameEditing = setEditing;
  setEditing(false);

  if (editBtn) {
    editBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setEditing(true);
      focusNameInput();
    };
  }

  const startEditFromName = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditing(true);
    focusNameInput();
  };

  if (staticWrap) {
    staticWrap.style.cursor = "pointer";
    staticWrap.addEventListener("click", startEditFromName);
  }
  if (staticEl) {
    staticEl.style.cursor = "pointer";
    staticEl.addEventListener("click", startEditFromName);
  }

  // Extra vangnet: als je in rename-mode zit en je focust een ander veld in de sheet,
  // sluit rename-mode (tenzij er een inline error staat).
  root.addEventListener(
    "focusin",
    (e) => {
      if (!isEditing) return;
      if (!inputWrap) return;

      const t = e.target;
      if (!t) return;

      // focus verlaat het naam-input gebied
      if (!inputWrap.contains(t)) {
        if (hasInlineErrorNow()) return;
        setEditing(false);
      }
    },
    true
  );

  if (inputEl) {
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        inputEl.blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        try {
          inputEl.value = String(staticEl?.textContent || inputEl.value || "");
        } catch (_) {}
        setEditing(false);
      }
    });

    inputEl.addEventListener("blur", () => {
      // Als er een inline error is: niet sluiten
      if (hasInlineErrorNow()) return;

      // Zet naam terug in static text
      if (staticEl) {
        const v = String(inputEl.value || "").trim();
        staticEl.textContent = v || String(staticEl.textContent || "");
      }

      setEditing(false);
    });
  }
}
