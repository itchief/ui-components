module.exports = {
  extends: ["stylelint-config-standard",
    "stylelint-config-rational-order",
    "stylelint-prettier/recommended" ],
  plugins: ["stylelint-order", "stylelint-scss"],
  rules: {
    "selector-class-pattern": "^[a-zA-Z0-9_-]+$",
    "selector-id-pattern": "^[a-zA-Z0-9_-]+$"
  }
};
