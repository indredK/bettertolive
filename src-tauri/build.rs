fn main() {
    tauri_build::build();

    // Windows: embed Common Controls v6 into test binaries.
    //
    // `tauri_build` links the app manifest into the main binary only. Unit test
    // executables (`cargo test --lib`) miss that manifest and crash on startup with
    // STATUS_ENTRYPOINT_NOT_FOUND (0xc0000139).
    //
    // See: https://github.com/tauri-apps/tauri/issues/13419
    // Pattern: https://github.com/farion1231/cc-switch/blob/main/src-tauri/build.rs
    #[cfg(windows)]
    embed_windows_test_manifest();
}

#[cfg(windows)]
fn embed_windows_test_manifest() {
    let manifest_path = std::path::PathBuf::from(
        std::env::var("CARGO_MANIFEST_DIR").expect("missing CARGO_MANIFEST_DIR"),
    )
    .join("common-controls.manifest");

    // MSVC accepts forward slashes in /MANIFESTINPUT paths.
    let manifest_input = manifest_path.to_string_lossy().replace('\\', "/");
    let manifest_arg = format!("/MANIFESTINPUT:{manifest_input}");

    println!("cargo:rerun-if-changed={}", manifest_path.display());
    // `rustc-link-arg-tests` only applies to explicit [[test]] targets, not lib #[test].
    // Use the global link arg for all artifacts, then disable duplicate embedding on bins.
    println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
    println!("cargo:rustc-link-arg={manifest_arg}");
    println!("cargo:rustc-link-arg-bins=/MANIFEST:NO");
}
