export default {
  "*.{js,jsx,ts,tsx,mjs,cjs}": [
    "eslint --max-warnings=0 --no-warn-ignored",
    "prettier --check",
  ],
  "*.{css,html,json,md,yml,yaml}": "prettier --check",
  "src-tauri/**/*.rs": () =>
    "cargo fmt --manifest-path src-tauri/Cargo.toml --all --check",
}
