const themes = {

    burgundy: {
        light: "#ead8d5",
        main: "#8f3d4a",
        dark: "#54242c"
    },

    sage: {
        light: "#dfe7dc",
        main: "#7b9470",
        dark: "#46583f"
    },

    olive: {
        light: "#e5e4d2",
        main: "#92934f",
        dark: "#5c5d2f"
    },

    forest: {
        light: "#d8e2dc",
        main: "#3f6855",
        dark: "#284638"
    },

    rose: {
        light: "#f0dddd",
        main: "#b86f78",
        dark: "#75434a"
    }

};


export function getTheme(name) {

    return themes[name];

}


export function getThemes() {

    return themes;

}