class State {

  constructor(init) {
    this._current = init;
    this.callbacks = new Map();
    this._prev = null;
  }

  get current() {
    return this._current;
  }

  set current(d) {
    this._current = d;
  }

  get prev() {
    return this._prev;
  }

  set prev(d) {
    this._prev = d;
  }

  subscribe(fn, skipFirst = false) {
    this.callbacks.set(fn, fn);
    const unsubscribe = () => this.callbacks.delete(fn);
    if (!skipFirst) fn(this.current);
    return unsubscribe;
  }

  patch(data) {
    this.prev = Object.assign({}, this.current);
    this.current = data;
    const entries = this.callbacks.entries();
    for (const cb of entries) {
      cb[1](data);
    }
  }

  apply(fn) {
    this.prev = Object.assign({}, this.current);
    this.patch(fn(this.current));
  }

  static Multi(states, fn, skipFirst = false) {

    function onChange(data) {
      fn(data);
    }

    const unsubscribes = states.map((s, i, array) => {
      return s.subscribe(ch => {
        onChange(array.map((e, j) => i === j ? ch : e.current));
      });
    });
    return unsubscribes;
  }

  toString() {
    return this.current;
  }

  toJSON() {
    return this.current;
  }
}

const incomeCat = [
  "salary",
  "awards",
  "sale",
  "rental",
  "refunds",
  "coupon",
  "investments",
  "other"
];

const expenseCat = [
  "food",
  "bills",
  "transportation",
  "home",
  "car",
  "entertainment",
  "shopping",
  "clothing",
  "insurance",
  "tax",
  "telephone",
  "cigarette",
  "health",
  "sport",
  "baby",
  "pet",
  "beauty",
  "electronics",
  "gift",
  "snacks",
  "social",
  "education",
  "travel",
  "book",
  "office",
  "other"
];

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

class Budget {
  constructor(type, category, amount, date) {
    this.type = type;
    this.category = category;
    this.amount = amount;
    this.date = date;
  }

  get formattedDate() {
    return this.date.toLocaleString();
  }

  get parsedAmount() {
    if (this.type === "income") {
      return "+ " + this.amount.toLocaleString();
    } else {
      return "- " + this.amount.toLocaleString();
    }
  }

  // using template literals
  render() {
    return `<div class="row budget-row">
        <div class="budget-container">
          <div class="budget-left">
            <h4 class="budget-category">${capitalize(this.category)}</h4>
            <h6 class="budget-time">${this.formattedDate}</h6>
          </div>
          <div class="budget-right">
            <h4 class="budget-amount budget-${this.type}">${this.parsedAmount}</h4>
          </div>
        </div>
     </div>`
  }
}

function buildOption(categories) {
  return categories.map(c => {
    const node = document.createElement("option");
    node.value = c;
    const temp = capitalize(c);
    node.innerHTML = temp;
    return node;
  });
}

async function init() {
  // VIEWS
  const contentContainer = document.querySelector("#content-container");
  const balanceText = document.querySelector("#balance-text")
  const addButton = document.querySelector("#add-button");
  const addModal = document.querySelector("#add-data-modal");
  const typeTabContainer = document.querySelector("#type-tab-container");

  // add-data-modal
  const selectTypeTab = document.querySelector("#select-type-container");
  const selectCategory = document.querySelector("#select-category");
  const addDataAmount = document.querySelector("#add-data-amount");
  const submitAddDataButton = document.querySelector("#submit-add-data");
  const cancelAddDataButton = document.querySelector("#cancel-add-data");

  // ---

  // states
  const budgetData = new State([]);
  const budgetTab = new State(0); // 0-All, 1-Income, 2-Expense
  const openAddModal = new State(false);

  const addModalState = new State({
    type: "income",
    category: "salary",
    amount: 0,
  });

  const contentRenderState = new State("");

  // ---

  // functions

  function resetAddModal() {
    addModalState.patch({
      type: "income",
      category: "salary",
      amount: 0,
    });
  }


  // ---

  // events
  addButton.addEventListener("click", e => {
    openAddModal.patch(true);
  });

  cancelAddDataButton.addEventListener("click", e => {
    resetAddModal();
    openAddModal.patch(!openAddModal.current);
  });

  submitAddDataButton.addEventListener("click", e => {
    const data = addModalState.current;
    console.log(data);
    const budget = new Budget(data.type, data.category, data.amount, new Date());
    budgetData.apply(d => {
      return [budget, ...d];
    });
    resetAddModal();
    openAddModal.patch(false);
  });

  const addSelectTypeTabs = selectTypeTab.children;
  for (const tab of addSelectTypeTabs) {
    tab.addEventListener("click", e => {
      const data = tab.getAttribute("data");
      addModalState.apply(d => {
        d.type = data;
        d.category = data === "income" ? incomeCat[0] : expenseCat[0];
        return d;
      });
    });
  }

  const children = typeTabContainer.children;
  for (const child of children) {
    child.addEventListener("click", e => {
      const data = child.getAttribute("data");
      budgetTab.patch(Number(data));
    });
  }

  selectCategory.addEventListener("change", e => {
    addModalState.apply(d => {
      d.category = e.target.value;
      return d;
    });
  });

  addDataAmount.addEventListener("change", e => {
    addModalState.apply(d => {
      d.amount = Number(e.target.value);
      return d;
    });
  });

  // SUBSCRIPTIONS
  // balance calculation
  budgetData.subscribe(data => {
    const balance = data.reduce((a, b) => {
      if (b.type === "income") {
        return a + b.amount;
      } else {
        return a - b.amount;
      }
    }, 0);
    balanceText.innerHTML = balance.toLocaleString();
  });

  // add modal state
  openAddModal.subscribe(open => {
    if (open) {
      addModal.classList.remove("hide");
    } else {
      addModal.classList.add("hide");
    }
  });

  budgetTab.subscribe(tab => {
    const children = typeTabContainer.children;
    for (const child of children) {
      const data = child.getAttribute("data");
      if (tab == data) {
        child.className = "pill-primary-dark";
      } else {
        child.className = "pill-primary";
      }
    }
  });

  addModalState.subscribe(data => {

    for (const child of addSelectTypeTabs) {
      const d = child.getAttribute("data");
      if (d == data.type) {
        child.className = "pill-primary-dark";
      } else {
        child.className = "pill-primary";
      }
    }

    const options = data.type === "income" ? buildOption(incomeCat) : buildOption(expenseCat);
    selectCategory.innerHTML = "";
    for (const opt of options) {
      if (opt.getAttribute("value") === data.category) {
        opt.selected = true;
      }
      selectCategory.appendChild(opt);
    }
    addDataAmount.value = data.amount;
  });

  // render budget items
  State.Multi([
    budgetTab,
    budgetData
  ], async ([
    budgetTab,
    budgetData
  ]) => {
    if (budgetTab == 0) {
      // return all
      const strHTML = budgetData
        .map(bd => {
          if (bd instanceof Budget) {
            return bd.render();
          }
        })
        .filter(d => d)
        .join("\n");

      contentRenderState.patch(strHTML);
    } else if (budgetTab == 1) {
      // filter income
      const strHTML = budgetData
        .filter(d => d.type === "income")
        .map(bd => {
          if (bd instanceof Budget) {
            return bd.render();
          }
        })
        .filter(d => d)
        .join("\n");

      contentRenderState.patch(strHTML);
    } else {
      // filter expense
      const strHTML = budgetData
        .filter(d => d.type === "expense")
        .map(bd => {
          if (bd instanceof Budget) {
            return bd.render();
          }
        })
        .filter(d => d)
        .join("\n");

      contentRenderState.patch(strHTML);
    }
  });


  contentRenderState.subscribe(data => {
    contentContainer.innerHTML = data;
  });

}

window.onload = init;