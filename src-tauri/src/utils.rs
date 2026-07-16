/// Funzione per visualizzare il nome  dell'SSID attivo
///
/// Per Windows è richiesto un crate apposito: https://github.com/microsoft/windows-rs
/// Dipendenza da aggiungere nel caso di programma multi piattaforma:
/// ```
/// [target.'cfg(target_os = "windows")'.dependencies]
/// windows = { version = "0.62.2", features = ["Devices_WiFi", "Networking_Connectivity"] }
/// ```
///
/// macOS non testato
pub fn get_wifi_ssid() -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        // Prova prima iwgetid -> wireless_tools
        std::process::Command::new("iwgetid")
            .arg("-r")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());

        // Fallback su nmcli
        std::process::Command::new("nmcli")
            .args(["connection", "show", "--active"])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .and_then(|s| {
                s.lines()
                    .find(|l| l.contains("wifi"))
                    .and_then(|l| l.split_whitespace().next())
                    .map(|s| s.trim().to_string())
            })
    }

    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new(
            "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport"
        )
            .arg("-I")
            .output()
            .ok()?;

        let stdout = String::from_utf8(output.stdout).ok()?;

        stdout
            .lines()
            .find(|l| l.trim_start().starts_with("SSID:"))
            .and_then(|l| l.split(':').nth(1))
            .map(|s| s.trim().to_string())
    }

    #[cfg(target_os = "windows")]
    {
        use windows::Networking::Connectivity::NetworkInformation;

        let profile = NetworkInformation::GetInternetConnectionProfile().ok()?;
        let ssid = profile
            .WlanConnectionProfileDetails()
            .ok()?
            .GetConnectedSsid()
            .ok()?;

        Some(ssid.to_string())
    }
}

#[cfg(target_os = "windows")]
pub fn resolve_windows_username(uid: &sysinfo::Uid) -> Option<String> {
    use windows::core::PCWSTR;
    use windows::core::PWSTR;
    use windows::Win32::Security::Authorization::ConvertStringSidToSidW;
    use windows::Win32::Security::{LookupAccountSidW, PSID, SID_NAME_USE};

    let sid_str = uid.to_string();
    let mut name_size: u32 = 256;
    let mut domain_size: u32 = 256;
    let mut name_buf = vec![0u16; name_size as usize];
    let mut domain_buf = vec![0u16; domain_size as usize];
    let mut sid_type = SID_NAME_USE::default();
    let wide_sid: Vec<u16> = sid_str.encode_utf16().chain(std::iter::once(0)).collect();
    let mut psid_out = PSID::default();

    unsafe {
        ConvertStringSidToSidW(PCWSTR(wide_sid.as_ptr()), &mut psid_out).ok()?;

        LookupAccountSidW(
            PCWSTR::null(),
            psid_out,
            Some(PWSTR(name_buf.as_mut_ptr())),
            &mut name_size,
            Some(PWSTR(domain_buf.as_mut_ptr())),
            &mut domain_size,
            &mut sid_type,
        )
        .ok()?;
    }

    let name = String::from_utf16_lossy(&name_buf[..name_size as usize]);
    if name.is_empty() {
        None
    } else {
        Some(name)
    }
}
