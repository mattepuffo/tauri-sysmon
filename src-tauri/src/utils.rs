pub fn get_wifi_ssid() -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        let output = std::process::Command::new("iwgetid")
            .arg("-r")
            .output()
            .ok()?;
        let ssid = String::from_utf8(output.stdout).ok()?.trim().to_string();
        if ssid.is_empty() {
            None
        } else {
            Some(ssid)
        }
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
        let output = std::process::Command::new("netsh")
            .args(["wlan", "show", "interfaces"])
            .output()
            .ok()?;
        let stdout = String::from_utf8(output.stdout).ok()?;
        stdout
            .lines()
            .find(|l| l.trim_start().starts_with("SSID") && !l.contains("BSSID"))
            .and_then(|l| l.split(':').nth(1))
            .map(|s| s.trim().to_string())
    }
}
