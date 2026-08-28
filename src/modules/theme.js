const themes = {
  burgundy: {
    light: "#ead8d5",
    main: "#e32323",
    dark: "#96021b",
  },

  sage: {
    light: "#bed8b5",
    main: "#7b9470",
    dark: "#46583f",
  },

  olive: {
    light: "#e5e2a8",
    main: "#92934f",
    dark: "#5c5d2f",
  },

  violet: {
    light: "#ddd0f0",
    main: "#7c4d9e",
    dark: "#4f2868",
  },

  rose: {
    light: "#f5bf81",
    main: "#e6a42b",
    dark: "#af7a2a",
  },
};

export function getTheme(name) {
  return themes[name];
}

export function getThemes() {
  return themes;
}
