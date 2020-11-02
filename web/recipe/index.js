class State {
  constructor(init) {
    this._current = init;
    this.callbacks = new Map();
  }

  get current() {
    return this._current;
  }

  set current(d) {
    this._current = d;
  }

  subscribe(fn, skipFirst = false) {
    this.callbacks.set(fn, fn);
    const unsubscribe = () => this.callbacks.delete(fn);
    if (!skipFirst) fn(this.current);
    return unsubscribe;
  }

  patch(data) {
    this.current = data;
    const entries = this.callbacks.entries();
    for (const cb of entries) {
      cb[1](data);
    }
  }

  apply(fn) {
    console.log("patch");
    this.patch(fn(this.current));
  }

  toString() {
    return this.current;
  }

  toJSON() {
    return this.current;
  }
}

const API_URL = "https://recipe-puppy.p.rapidapi.com";
const headers = {
  "x-rapidapi-host": "recipe-puppy.p.rapidapi.com",
  "x-rapidapi-key": "ed3f114408msh3baf30760888d20p178aa5jsn4abfa5fe9ecf"
};

function buildURL(queries) {
  const url = new URL(API_URL);
  Object.keys(queries).forEach(k => {
    if (queries[k]) url.searchParams.set(k, queries[k]);
  });
  return url.toString();
}

/**
 * get result
 * @param {string} page 
 * @param {string[]} ingredients 
 * @param {string} search 
 */
async function getRecipe(page, ingredients, search) {
  const method = "GET";
  const queries = {
    p: page,
    i: ingredients
      .map(i => i.trim())
      .join(","),
    q: search
  };

  const url = buildURL(queries);
  console.log(url);
  const response = await fetch(url, { method, headers });
  const data = await response.json();
  console.log(data);
  return data;
}

function buildRecipeRow(data) {
  const row = document.createElement("div");
  row.className = "row recipe-row";

  const imgContainer = document.createElement("div");
  imgContainer.className = "m-2"
  imgContainer.style.backgroundImage = `url(${data.thumbnail})`;
  imgContainer.style.backgroundSize = "cover";
  imgContainer.style.backgroundRepeat = "none";
  imgContainer.style.backgroundPosition = "center";
  imgContainer.style.minWidth = "100px";
  imgContainer.style.height = "100px";

  row.appendChild(imgContainer);

  const rowDesc = document.createElement("div");
  rowDesc.className = "col recipe-desc p-2";

  const recipeTitle = document.createElement("h4");
  recipeTitle.className = "recipe-title";
  recipeTitle.innerHTML = data.title;

  const recipeLink = document.createElement("a");
  recipeLink.href = data.href;
  recipeLink.target = "_blank";
  recipeLink.className = "recipe-link";
  recipeLink.appendChild(recipeTitle);

  const recipeIngredients = document.createElement("p");
  recipeIngredients.style.margintop = 1;
  recipeIngredients.className = "recipe-ingredients";
  recipeIngredients.innerHTML = data.ingredients;

  rowDesc.appendChild(recipeLink);
  rowDesc.appendChild(recipeIngredients);

  row.appendChild(rowDesc);

  return row;
}

function buildPagination(page, prev, next) {
  const prevButton = document.createElement("button");
  prevButton.innerHTML = "Prev";
  if (page == 1) {
    prevButton.className = "pg-button pg-disabled";
    prevButton.disabled = true;
  } else {
    prevButton.className = "pg-button";
    prevButton.addEventListener("click", prev);
  }

  const nextButton = document.createElement("button");
  nextButton.className = "pg-button";
  nextButton.innerHTML = "Next";
  nextButton.addEventListener("click", next);


  const currentPage = document.createElement("button");
  currentPage.className = "pg-button pg-disabled";
  currentPage.disabled = true;
  currentPage.innerHTML = page;

  return [prevButton, currentPage, nextButton];
}

/**
 * INIT
 */
async function init() {
  const version = document.querySelector("#version");
  const searchInput = document.querySelector("#searchInput");
  const ingredientsInput = document.querySelector("#ingredientsInput");
  const searchButton = document.querySelector("#searchButton");
  const recipeContainer = document.querySelector("#recipeContainer");
  const pagination = document.querySelector("#pagination");

  const loadingState = new State(true);

  const state = new State({
    page: 1,
    search: "",
    ingredients: [],
  });

  const recipe = new State([]);
  const recipeRender = new State([]);
  const paginationRender = new State(null);

  searchButton.addEventListener("click", e => {
    state.apply(current => {
      current.page = 1;
      current.search = searchInput.value;
      current.ingredients = ingredientsInput.value.split(",");
      return current;
    });
  });

  // update render data
  state.subscribe(async s => {
    try {
      loadingState.patch(true);
      const { page, search, ingredients } = s;
      const resp = await getRecipe(page, ingredients, search);
      recipe.patch(resp.results);
      version.innerHTML = "version " + resp.version;
    } catch (err) {
      console.error(err);
    } finally {
      loadingState.patch(false);
    }
  });

  // update pagination
  state.subscribe(s => {

    const prev = () => state.apply(s => {
      s.page = s.page - 1;
      return s;
    });

    const next = () => state.apply(s => {
      s.page = s.page + 1;
      return s;
    });

    const paginations = buildPagination(s.page, prev, next);
    paginationRender.patch(paginations);

  });

  // transform to recipeRow
  recipe.subscribe(recipes => {
    const rows = recipes.map(buildRecipeRow);
    recipeRender.patch(rows);
  });

  loadingState.subscribe(loading => {

    if (loading) {
      // show loading
      recipeContainer.innerHTML = "Loading...";
      pagination.innerHTML = "";
    } else {

      // render recipes
      recipeContainer.innerHTML = "";
      for (const row of recipeRender.current) {
        recipeContainer.appendChild(row);
      }

      if (!recipeRender.current.length) {
        recipeContainer.innerHTML = "No Data.";
      } else {
        // render pagination
        pagination.innerHTML = "";
        for (const p of paginationRender.current) {
          pagination.appendChild(p);
        }
      }
    }
  });

}


window.onload = init;