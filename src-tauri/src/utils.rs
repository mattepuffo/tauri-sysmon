#[cfg(target_os = "windows")]
use windows::Networking::Connectivity::NetworkInformation;

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
        let ssid = std::process::Command::new("iwgetid")
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
        let profile = NetworkInformation::GetInternetConnectionProfile().ok()?;
        let ssid = profile
            .WlanConnectionProfileDetails()
            .ok()?
            .GetConnectedSsid()
            .ok()?;

        Some(ssid.to_string())
    }
}
