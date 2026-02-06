// scripts/core/state/categories-ui/type-toggle.js

export function bindTypeToggle({ root, lockType, initialSelectedType, onChange }) {
  let selectedType = initialSelectedType;

  const btnExpense = root.querySelector("#typeExpense");
  const btnIncome = root.querySelector("#typeIncome");

  const updateTypeUI = () => {
    if (!btnExpense || !btnIncome) return;
    btnExpense.classList.remove("is-active-red");
    btnIncome.classList.remove("is-active-green");
    if (selectedType === "expense") btnExpense.classList.add("is-active-red");
    else btnIncome.classList.add("is-active-green");
  };

  const enableBtn = (btn) => {
    btn.disabled = false;
    btn.removeAttribute("aria-disabled");
    btn.style.opacity = "";
    btn.style.pointerEvents = "";
    btn.style.filter = "";
  };

  const disableBtn = (btn) => {
    btn.disabled = true;
    btn.setAttribute("aria-disabled", "true");
    btn.style.opacity = "0.45";
    btn.style.pointerEvents = "none";
    btn.style.filter = "grayscale(1)";
  };

  const applyTypeLockUI = () => {
    if (!btnExpense || !btnIncome) return;

    enableBtn(btnExpense);
    enableBtn(btnIncome);

    if (!lockType) return;

    if (selectedType === "income") disableBtn(btnExpense);
    else disableBtn(btnIncome);
  };

  if (btnExpense) btnExpense.onclick = () => {
    if (lockType) return;
    selectedType = "expense";
    updateTypeUI();
    applyTypeLockUI();
    if (typeof onChange === "function") onChange(selectedType);
  };

  if (btnIncome) btnIncome.onclick = () => {
    if (lockType) return;
    selectedType = "income";
    updateTypeUI();
    applyTypeLockUI();
    if (typeof onChange === "function") onChange(selectedType);
  };

  updateTypeUI();
  applyTypeLockUI();

  return {
    getSelectedType: () => selectedType,
    setSelectedType: (v) => {
      selectedType = v;
      updateTypeUI();
      applyTypeLockUI();
      if (typeof onChange === "function") onChange(selectedType);
    }
  };
}
