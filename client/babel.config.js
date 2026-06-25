export default (api) => ({
  presets: api.env("test")
    ? [["@babel/preset-env", { targets: { node: "current" } }]]
    : [],
  plugins: ["@babel/plugin-syntax-jsx"],
});
