fn main() {
    #[cfg(windows)]
    {
        // Link Common Controls v6 manifest into all Windows artifacts (including test binaries).
        // Without this, `cargo test` fails with STATUS_ENTRYPOINT_NOT_FOUND on Windows.
        // https://github.com/tauri-apps/tauri/issues/13419
        embed_resource::compile_for_everything("windows-app-manifest.xml", embed_resource::NONE);
    }

    #[cfg(windows)]
    let attributes = tauri_build::Attributes::new()
        .windows_attributes(tauri_build::WindowsAttributes::new_without_app_manifest());

    #[cfg(not(windows))]
    let attributes = tauri_build::Attributes::new();

    tauri_build::try_build(attributes).expect("failed to run tauri build");
}
