// ─────────────────────────────────────────────────────────────────────────────
// Smartphone Issues Catalog
// Structured for autocomplete: category → issues[]
// Each issue has a unique id, display label, and aliases for fuzzy search
// ─────────────────────────────────────────────────────────────────────────────

export type Issue = {
  id: string;
  label: string;
  aliases?: string[];
};

export type IssueCategory = {
  id: string;
  label: string;
  issues: Issue[];
};

export const issueCatalog: IssueCategory[] = [
  {
    id: "screen_display",
    label: "Screen & Display",
    issues: [
      {
        id: "cracked_screen",
        label: "Cracked / Shattered Screen",
        aliases: [
          "broken screen",
          "smashed screen",
          "shattered display",
          "cracked glass",
        ],
      },
      {
        id: "broken_lcd",
        label: "Broken LCD / Black Blotch",
        aliases: [
          "black spot",
          "ink spot",
          "lcd damage",
          "dark patch on screen",
        ],
      },
      {
        id: "screen_not_turning_on",
        label: "Screen Not Turning On",
        aliases: ["black screen", "blank display", "screen won't turn on"],
      },
      {
        id: "touch_unresponsive",
        label: "Touchscreen Not Responding",
        aliases: [
          "touch not working",
          "unresponsive touch",
          "screen not sensitive",
        ],
      },
      {
        id: "touch_ghost",
        label: "Ghost Touch / Phantom Inputs",
        aliases: [
          "screen touching itself",
          "random taps",
          "phantom touch",
          "ghost input",
        ],
      },
      {
        id: "screen_flickering",
        label: "Screen Flickering",
        aliases: ["flashing screen", "blinking display", "screen blink"],
      },
      {
        id: "lines_on_screen",
        label: "Lines on Screen",
        aliases: ["horizontal lines", "vertical lines", "stripes on display"],
      },
      {
        id: "dead_pixels",
        label: "Dead / Stuck Pixels",
        aliases: ["pixel dot", "stuck pixel", "white dot", "dead spot"],
      },
      {
        id: "screen_burn_in",
        label: "Screen Burn-In",
        aliases: [
          "ghost image",
          "image retention",
          "permanent image",
          "burn in",
        ],
      },
      {
        id: "screen_discolouration",
        label: "Screen Discolouration / Tint",
        aliases: [
          "yellow tint",
          "green tint",
          "pink tint",
          "screen colour issue",
          "colour cast",
        ],
      },
      {
        id: "screen_dim",
        label: "Screen Too Dim",
        aliases: ["low brightness", "dark display", "screen not bright enough"],
      },
      {
        id: "auto_brightness",
        label: "Auto-Brightness Not Working",
        aliases: ["brightness sensor", "adaptive brightness broken"],
      },
      {
        id: "screen_timeout",
        label: "Screen Timeout / Sleep Issues",
        aliases: [
          "screen turns off too fast",
          "screen stays on",
          "always on display issue",
        ],
      },
      {
        id: "refresh_rate_issue",
        label: "Refresh Rate / Lag on Display",
        aliases: ["choppy scrolling", "stuttery display", "120hz not working"],
      },
      {
        id: "notch_punch_hole_issue",
        label: "Notch / Punch-Hole Area Issue",
        aliases: ["camera cutout issue", "notch dark", "punch hole dark"],
      },
      {
        id: "earpiece_mesh_blocked",
        label: "Earpiece Mesh Blocked",
        aliases: ["top speaker dirty", "can't hear calls", "earpiece clogged"],
      },
    ],
  },
  {
    id: "battery_power",
    label: "Battery & Power",
    issues: [
      {
        id: "battery_draining_fast",
        label: "Battery Draining Fast",
        aliases: [
          "poor battery life",
          "battery dies quickly",
          "short battery",
          "low endurance",
        ],
      },
      {
        id: "phone_not_charging",
        label: "Phone Not Charging",
        aliases: ["won't charge", "no charge", "not charging at all"],
      },
      {
        id: "slow_charging",
        label: "Charging Slowly",
        aliases: [
          "slow charge",
          "takes long to charge",
          "fast charge not working",
        ],
      },
      {
        id: "wireless_charging_fail",
        label: "Wireless Charging Not Working",
        aliases: [
          "qi not working",
          "inductive charging broken",
          "pad not charging",
        ],
      },
      {
        id: "reverse_charging_fail",
        label: "Reverse Wireless Charging Not Working",
        aliases: ["powershare not working", "share charge broken"],
      },
      {
        id: "overheating",
        label: "Phone Overheating",
        aliases: [
          "phone too hot",
          "heating up",
          "thermal throttle",
          "burns while charging",
        ],
      },
      {
        id: "battery_swollen",
        label: "Swollen / Bloated Battery",
        aliases: [
          "puffed battery",
          "bulging battery",
          "swelled battery",
          "battery bump",
        ],
      },
      {
        id: "phone_not_turning_on",
        label: "Phone Not Turning On",
        aliases: [
          "dead phone",
          "won't power on",
          "black screen of death",
          "no power",
        ],
      },
      {
        id: "phone_randomly_shuts_off",
        label: "Phone Randomly Shuts Off",
        aliases: [
          "turns off by itself",
          "random shutdown",
          "spontaneous reboot",
          "powers off",
        ],
      },
      {
        id: "battery_percentage_jump",
        label: "Battery Percentage Jumping",
        aliases: [
          "inaccurate battery",
          "battery percentage wrong",
          "jumps from 20 to dead",
        ],
      },
      {
        id: "charging_port_loose",
        label: "Charging Port Loose / Wobbly",
        aliases: ["cable falls out", "port not gripping", "loose usb"],
      },
      {
        id: "charging_port_dirty",
        label: "Charging Port Dirty / Blocked",
        aliases: ["lint in port", "fluff in charger", "debris in port"],
      },
    ],
  },
  {
    id: "camera_issues",
    label: "Camera",
    issues: [
      {
        id: "camera_not_opening",
        label: "Camera App Not Opening",
        aliases: ["camera crash", "camera app fails", "camera force close"],
      },
      {
        id: "camera_black_screen",
        label: "Camera Shows Black Screen",
        aliases: [
          "camera blank",
          "camera not showing image",
          "camera no preview",
        ],
      },
      {
        id: "camera_blurry",
        label: "Camera Taking Blurry Photos",
        aliases: ["out of focus", "blurry pictures", "camera not sharp"],
      },
      {
        id: "autofocus_not_working",
        label: "Autofocus Not Working",
        aliases: ["won't focus", "focus stuck", "manual focus only"],
      },
      {
        id: "camera_lens_cracked",
        label: "Camera Lens Cracked / Scratched",
        aliases: ["cracked camera glass", "scratched lens", "lens damage"],
      },
      {
        id: "front_camera_issue",
        label: "Front Camera Not Working",
        aliases: ["selfie camera broken", "front facing camera issue"],
      },
      {
        id: "rear_camera_issue",
        label: "Rear Camera Not Working",
        aliases: ["back camera broken", "main camera not working"],
      },
      {
        id: "camera_lines_artifacts",
        label: "Lines / Artifacts in Camera",
        aliases: ["camera distortion", "lines in viewfinder", "camera noise"],
      },
      {
        id: "camera_overexposed",
        label: "Photos Overexposed / Washed Out",
        aliases: ["too bright photos", "white out photos", "exposure issue"],
      },
      {
        id: "camera_dark_photos",
        label: "Photos Too Dark",
        aliases: ["dark pictures", "underexposed", "low light issue"],
      },
      {
        id: "flash_not_working",
        label: "Flash / Torch Not Working",
        aliases: ["flashlight broken", "led flash not working", "torch not on"],
      },
      {
        id: "camera_shaking",
        label: "Camera Shaky / OIS Not Working",
        aliases: [
          "ois broken",
          "shaky photos",
          "image stabilisation not working",
        ],
      },
      {
        id: "zoom_not_working",
        label: "Zoom Not Working",
        aliases: [
          "telephoto broken",
          "optical zoom issue",
          "periscope camera issue",
        ],
      },
      {
        id: "video_recording_issue",
        label: "Video Recording Issue",
        aliases: ["video not recording", "video laggy", "video crash"],
      },
    ],
  },
  {
    id: "audio_sound",
    label: "Audio & Sound",
    issues: [
      {
        id: "no_sound",
        label: "No Sound / Audio Output",
        aliases: ["silent phone", "no audio", "muted phone"],
      },
      {
        id: "loudspeaker_not_working",
        label: "Loudspeaker Not Working",
        aliases: [
          "bottom speaker broken",
          "external speaker dead",
          "no speaker sound",
        ],
      },
      {
        id: "earpiece_not_working",
        label: "Earpiece Not Working",
        aliases: [
          "can't hear on calls",
          "top speaker broken",
          "call speaker dead",
        ],
      },
      {
        id: "distorted_audio",
        label: "Distorted / Crackling Sound",
        aliases: [
          "buzzing speaker",
          "crackling audio",
          "muffled sound",
          "static",
        ],
      },
      {
        id: "microphone_not_working",
        label: "Microphone Not Working",
        aliases: [
          "mic dead",
          "caller can't hear me",
          "voice not picked up",
          "no mic",
        ],
      },
      {
        id: "muffled_microphone",
        label: "Muffled Microphone",
        aliases: ["mic muffled", "bad microphone quality", "voice unclear"],
      },
      {
        id: "headphone_jack_issue",
        label: "Headphone Jack Issue",
        aliases: ["aux not working", "3.5mm broken", "earphones not detected"],
      },
      {
        id: "bluetooth_audio_issue",
        label: "Bluetooth Audio Issues",
        aliases: [
          "bt headphones cutting out",
          "bluetooth audio lag",
          "earbuds disconnecting",
        ],
      },
      {
        id: "volume_buttons_not_working",
        label: "Volume Buttons Not Working",
        aliases: ["can't adjust volume", "volume key stuck", "volume broken"],
      },
      {
        id: "call_quality_poor",
        label: "Poor Call Quality",
        aliases: [
          "calls cutting out",
          "choppy calls",
          "echo on calls",
          "bad reception on calls",
        ],
      },
    ],
  },
  {
    id: "connectivity",
    label: "Connectivity",
    issues: [
      {
        id: "no_signal",
        label: "No Mobile Signal",
        aliases: ["no network", "no bars", "no service", "lost signal"],
      },
      {
        id: "weak_signal",
        label: "Weak / Dropping Signal",
        aliases: [
          "low signal",
          "dropped calls",
          "intermittent signal",
          "poor reception",
        ],
      },
      {
        id: "wifi_not_connecting",
        label: "Wi-Fi Not Connecting",
        aliases: ["wifi broken", "can't join wifi", "wifi fails to connect"],
      },
      {
        id: "wifi_dropping",
        label: "Wi-Fi Keeps Dropping",
        aliases: [
          "wifi disconnects",
          "unstable wifi",
          "wifi keeps cutting out",
        ],
      },
      {
        id: "wifi_slow",
        label: "Slow Wi-Fi Speed",
        aliases: ["wifi slow", "weak wifi", "bad wifi speed"],
      },
      {
        id: "bluetooth_not_connecting",
        label: "Bluetooth Not Connecting",
        aliases: [
          "bt not pairing",
          "bluetooth broken",
          "can't find bluetooth device",
        ],
      },
      {
        id: "bluetooth_dropping",
        label: "Bluetooth Keeps Disconnecting",
        aliases: ["bluetooth cutting out", "bt drops", "bluetooth unstable"],
      },
      {
        id: "nfc_not_working",
        label: "NFC Not Working",
        aliases: [
          "contactless payment broken",
          "tap to pay not working",
          "nfc broken",
        ],
      },
      {
        id: "5g_not_working",
        label: "5G Not Working",
        aliases: [
          "5g broken",
          "stuck on 4g",
          "no 5g signal",
          "5g not available",
        ],
      },
      {
        id: "4g_lte_issue",
        label: "4G / LTE Issue",
        aliases: ["no lte", "slow 4g", "4g dropping", "mobile data slow"],
      },
      {
        id: "mobile_data_not_working",
        label: "Mobile Data Not Working",
        aliases: [
          "internet not working",
          "data not connecting",
          "no internet on data",
        ],
      },
      {
        id: "gps_not_working",
        label: "GPS / Location Not Working",
        aliases: [
          "maps not accurate",
          "location off",
          "gps fix slow",
          "navigation issue",
        ],
      },
      {
        id: "hotspot_not_working",
        label: "Mobile Hotspot Not Working",
        aliases: [
          "tethering broken",
          "personal hotspot issue",
          "wifi sharing not working",
        ],
      },
      {
        id: "usb_not_detected",
        label: "USB / PC Not Detecting Phone",
        aliases: [
          "not recognized by computer",
          "usb connection issue",
          "mtp not working",
        ],
      },
      {
        id: "sim_not_detected",
        label: "SIM Card Not Detected",
        aliases: ["no sim", "sim not reading", "invalid sim", "sim error"],
      },
      {
        id: "dual_sim_issue",
        label: "Dual SIM Issue",
        aliases: [
          "second sim not working",
          "esim issue",
          "dual sim switching problem",
        ],
      },
      {
        id: "airplane_mode_stuck",
        label: "Stuck in Airplane Mode",
        aliases: [
          "can't turn off airplane mode",
          "airplane mode won't disable",
        ],
      },
    ],
  },
  {
    id: "software_system",
    label: "Software & System",
    issues: [
      {
        id: "phone_slow",
        label: "Phone Slow / Lagging",
        aliases: [
          "sluggish phone",
          "performance issue",
          "running slow",
          "freezing",
        ],
      },
      {
        id: "apps_crashing",
        label: "Apps Crashing / Force Closing",
        aliases: [
          "app keeps stopping",
          "app crash",
          "force close",
          "apps not opening",
        ],
      },
      {
        id: "bootloop",
        label: "Stuck in Bootloop",
        aliases: [
          "stuck on logo",
          "keeps restarting",
          "boot loop",
          "infinite reboot",
        ],
      },
      {
        id: "phone_freezing",
        label: "Phone Freezing / Unresponsive",
        aliases: ["frozen screen", "phone hung", "completely unresponsive"],
      },
      {
        id: "random_restarts",
        label: "Random Restarts",
        aliases: [
          "phone rebooting itself",
          "spontaneous restart",
          "turns off and on",
        ],
      },
      {
        id: "update_failed",
        label: "Software Update Failed",
        aliases: [
          "update error",
          "os update stuck",
          "update loop",
          "firmware fail",
        ],
      },
      {
        id: "storage_full",
        label: "Storage Full / Low Space",
        aliases: [
          "no storage",
          "storage almost full",
          "not enough space",
          "memory full",
        ],
      },
      {
        id: "app_not_installing",
        label: "Apps Not Installing",
        aliases: [
          "can't install app",
          "installation failed",
          "app won't download",
        ],
      },
      {
        id: "play_store_issue",
        label: "Play Store / App Store Not Working",
        aliases: ["google play broken", "app store error", "can't open store"],
      },
      {
        id: "notifications_not_working",
        label: "Notifications Not Working",
        aliases: [
          "no notifications",
          "missing notifications",
          "push notifications broken",
        ],
      },
      {
        id: "phone_hot_software",
        label: "Phone Overheating (Software-Related)",
        aliases: [
          "software causing heat",
          "app causing overheating",
          "background process heat",
        ],
      },
      {
        id: "dark_mode_issue",
        label: "Dark Mode / Display Settings Issue",
        aliases: [
          "dark mode not applying",
          "theme broken",
          "display settings stuck",
        ],
      },
      {
        id: "settings_crashing",
        label: "Settings App Crashing",
        aliases: ["settings won't open", "settings force close"],
      },
      {
        id: "date_time_wrong",
        label: "Date / Time Incorrect",
        aliases: [
          "wrong time",
          "clock wrong",
          "time resetting",
          "date incorrect",
        ],
      },
      {
        id: "language_locale_issue",
        label: "Language / Region Issue",
        aliases: ["language changed", "region wrong", "locale bug"],
      },
      {
        id: "developer_options_issue",
        label: "Developer Options / Debugging Issue",
        aliases: ["usb debugging", "adb issue", "developer mode stuck"],
      },
    ],
  },
  {
    id: "security_access",
    label: "Security & Access",
    issues: [
      {
        id: "fingerprint_not_working",
        label: "Fingerprint Sensor Not Working",
        aliases: [
          "fingerprint broken",
          "touch id failing",
          "biometric not recognising",
        ],
      },
      {
        id: "face_unlock_not_working",
        label: "Face Unlock Not Working",
        aliases: [
          "face id broken",
          "face recognition failing",
          "face not recognised",
        ],
      },
      {
        id: "locked_out",
        label: "Locked Out of Phone",
        aliases: [
          "forgot pin",
          "forgot password",
          "forgot pattern",
          "can't unlock",
        ],
      },
      {
        id: "icloud_lock",
        label: "iCloud Activation Lock",
        aliases: [
          "find my iphone lock",
          "icloud locked",
          "activation locked iphone",
        ],
      },
      {
        id: "google_frp_lock",
        label: "Google FRP / Account Lock",
        aliases: [
          "factory reset protection",
          "frp bypass",
          "google account lock",
        ],
      },
      {
        id: "network_locked",
        label: "Network / Carrier Locked",
        aliases: [
          "sim locked",
          "carrier locked",
          "locked to network",
          "not accepting sim",
        ],
      },
      {
        id: "virus_malware",
        label: "Virus / Malware Suspected",
        aliases: [
          "phone hacked",
          "malware on phone",
          "suspicious app",
          "virus",
        ],
      },
      {
        id: "privacy_concern",
        label: "Privacy / Security Concern",
        aliases: ["data breach concern", "phone monitored", "spyware"],
      },
    ],
  },
  {
    id: "calls_messaging",
    label: "Calls & Messaging",
    issues: [
      {
        id: "cant_make_calls",
        label: "Can't Make / Receive Calls",
        aliases: [
          "no calling",
          "calls not working",
          "call failed",
          "dialer issue",
        ],
      },
      {
        id: "calls_dropping",
        label: "Calls Dropping / Cutting Out",
        aliases: ["call drops", "disconnected calls", "call keeps ending"],
      },
      {
        id: "echo_on_calls",
        label: "Echo / Feedback on Calls",
        aliases: ["hearing myself on call", "call echo", "voice echo"],
      },
      {
        id: "sms_not_sending",
        label: "SMS / Text Messages Not Sending",
        aliases: ["texts not going through", "messages failing", "sms failed"],
      },
      {
        id: "mms_not_working",
        label: "MMS / Picture Messages Not Working",
        aliases: [
          "can't send pictures via sms",
          "mms failed",
          "group sms issue",
        ],
      },
      {
        id: "whatsapp_call_issue",
        label: "WhatsApp / VoIP Call Issue",
        aliases: [
          "whatsapp calling not working",
          "voip issue",
          "internet call problem",
        ],
      },
      {
        id: "voicemail_issue",
        label: "Voicemail Not Working",
        aliases: [
          "visual voicemail broken",
          "can't access voicemail",
          "voicemail setup issue",
        ],
      },
      {
        id: "caller_id_issue",
        label: "Caller ID Not Showing",
        aliases: [
          "no caller id",
          "unknown number showing",
          "caller name not appearing",
        ],
      },
      {
        id: "call_forwarding_issue",
        label: "Call Forwarding Not Working",
        aliases: ["call divert broken", "forward calls issue"],
      },
    ],
  },
  {
    id: "physical_damage",
    label: "Physical & Liquid Damage",
    issues: [
      {
        id: "water_damage",
        label: "Water / Liquid Damage",
        aliases: [
          "dropped in water",
          "wet phone",
          "phone got wet",
          "liquid damage",
          "rain damage",
        ],
      },
      {
        id: "dropped_phone",
        label: "Phone Dropped / Impact Damage",
        aliases: ["fell on floor", "dropped", "physical impact", "fall damage"],
      },
      {
        id: "bent_phone",
        label: "Bent / Warped Frame",
        aliases: [
          "phone bent",
          "chassis warped",
          "curved frame",
          "bent chassis",
        ],
      },
      {
        id: "cracked_back",
        label: "Cracked / Broken Back Glass",
        aliases: ["back glass broken", "rear glass cracked", "shattered back"],
      },
      {
        id: "dented_frame",
        label: "Dented / Scratched Frame",
        aliases: ["frame dent", "scratches on body", "cosmetic damage"],
      },
      {
        id: "phone_in_sand_dust",
        label: "Sand / Dust Ingress",
        aliases: ["dust inside phone", "sand damage", "dust under screen"],
      },
      {
        id: "phone_run_over",
        label: "Phone Run Over / Crushed",
        aliases: [
          "car ran over phone",
          "crushed phone",
          "severe physical damage",
        ],
      },
    ],
  },
  {
    id: "buttons_biometrics",
    label: "Buttons & Biometrics",
    issues: [
      {
        id: "power_button_stuck",
        label: "Power Button Stuck / Not Working",
        aliases: [
          "on/off stuck",
          "side button broken",
          "power key not pressing",
        ],
      },
      {
        id: "volume_button_stuck",
        label: "Volume Button Stuck / Not Working",
        aliases: [
          "volume key stuck",
          "volume button broken",
          "volume unresponsive",
        ],
      },
      {
        id: "home_button_broken",
        label: "Home Button Not Working",
        aliases: ["home key broken", "capacitive home broken"],
      },
      {
        id: "mute_switch_broken",
        label: "Mute / Silent Switch Broken",
        aliases: ["ringer switch broken", "silent toggle stuck"],
      },
      {
        id: "in_display_fingerprint",
        label: "In-Display Fingerprint Not Working",
        aliases: [
          "under display fingerprint",
          "optical fingerprint broken",
          "ultrasonic fingerprint issue",
        ],
      },
    ],
  },
  {
    id: "foldable_specific",
    label: "Foldable Phone",
    issues: [
      {
        id: "hinge_stiff",
        label: "Hinge Stiff / Hard to Open",
        aliases: ["fold hard to open", "stiff hinge", "flip hard to open"],
      },
      {
        id: "hinge_loose",
        label: "Hinge Loose / Wobbly",
        aliases: ["loose hinge", "floppy hinge", "fold not staying open"],
      },
      {
        id: "hinge_creak",
        label: "Hinge Creaking / Grinding",
        aliases: ["hinge noise", "creak when folding", "grinding hinge"],
      },
      {
        id: "inner_screen_cracked",
        label: "Inner Foldable Screen Cracked",
        aliases: [
          "fold screen cracked",
          "main screen broken",
          "inner display damaged",
        ],
      },
      {
        id: "fold_crease_severe",
        label: "Fold Crease / Visible Crease",
        aliases: ["screen crease", "fold line visible", "middle crease deep"],
      },
      {
        id: "cover_screen_cracked",
        label: "Cover Screen Cracked",
        aliases: ["outer screen broken", "external display cracked"],
      },
      {
        id: "fold_not_flat",
        label: "Phone Not Folding / Unfolding Flat",
        aliases: ["won't close fully", "gap when closed", "doesn't lay flat"],
      },
      {
        id: "utg_peeling",
        label: "Screen Protector / UTG Peeling",
        aliases: [
          "film peeling",
          "screen layer lifting",
          "ultra thin glass issue",
        ],
      },
      {
        id: "water_ingress_fold",
        label: "Water Ingress at Hinge",
        aliases: ["water in fold", "liquid at hinge", "moisture in hinge"],
      },
    ],
  },
  {
    id: "performance",
    label: "Performance & Storage",
    issues: [
      {
        id: "low_storage",
        label: "Low Storage Space",
        aliases: [
          "full storage",
          "no space",
          "internal memory full",
          "can't save files",
        ],
      },
      {
        id: "ram_issue",
        label: "RAM / Memory Issue",
        aliases: [
          "apps closing in background",
          "multitasking issue",
          "not enough ram",
        ],
      },
      {
        id: "phone_laggy",
        label: "Phone Laggy / Slow Performance",
        aliases: ["slow phone", "lagging", "sluggish", "performance degraded"],
      },
      {
        id: "phone_heating_performance",
        label: "Phone Heating Affecting Performance",
        aliases: [
          "thermal throttling",
          "slows down when hot",
          "overheating lag",
        ],
      },
      {
        id: "gaming_performance",
        label: "Poor Gaming Performance",
        aliases: [
          "games lagging",
          "fps drops",
          "game stuttering",
          "frame drops",
        ],
      },
      {
        id: "sd_card_issue",
        label: "SD Card Not Detected / Error",
        aliases: [
          "memory card issue",
          "sd card not reading",
          "external storage error",
        ],
      },
    ],
  },
  {
    id: "accessories",
    label: "Accessories & Peripherals",
    issues: [
      {
        id: "case_fit_issue",
        label: "Case Not Fitting Properly",
        aliases: ["case loose", "cover doesn't fit", "case gap"],
      },
      {
        id: "stylus_not_working",
        label: "S Pen / Stylus Not Working",
        aliases: ["s pen broken", "stylus unresponsive", "pen not detected"],
      },
      {
        id: "stylus_silo_issue",
        label: "Stylus Silo / Slot Issue",
        aliases: ["s pen slot broken", "stylus stuck", "pen not inserting"],
      },
      {
        id: "charger_not_working",
        label: "Charger / Cable Not Working",
        aliases: ["charger broken", "cable fault", "charging brick issue"],
      },
      {
        id: "screen_protector_issue",
        label: "Screen Protector Issue",
        aliases: [
          "tempered glass lifting",
          "protector bubbling",
          "protector affecting touch",
        ],
      },
      {
        id: "earbuds_not_pairing",
        label: "Earbuds / Headphones Not Pairing",
        aliases: [
          "earphones won't connect",
          "buds won't pair",
          "wireless headphones issue",
        ],
      },
      {
        id: "smartwatch_sync_issue",
        label: "Smartwatch / Wearable Sync Issue",
        aliases: [
          "watch not syncing",
          "galaxy watch not connecting",
          "wearable disconnecting",
        ],
      },
    ],
  },
  {
    id: "data_account",
    label: "Data, Backup & Accounts",
    issues: [
      {
        id: "data_lost",
        label: "Data Lost / Accidentally Deleted",
        aliases: ["deleted photos", "lost contacts", "wiped data", "data gone"],
      },
      {
        id: "backup_not_working",
        label: "Backup Not Working",
        aliases: [
          "icloud backup failed",
          "google backup failed",
          "backup error",
        ],
      },
      {
        id: "sync_issue",
        label: "Contacts / Calendar Not Syncing",
        aliases: [
          "contacts not syncing",
          "calendar sync broken",
          "google sync issue",
        ],
      },
      {
        id: "google_account_issue",
        label: "Google Account Issue",
        aliases: ["google account not signing in", "google account sync error"],
      },
      {
        id: "apple_id_issue",
        label: "Apple ID Issue",
        aliases: [
          "apple id not working",
          "icloud sign in issue",
          "apple account locked",
        ],
      },
      {
        id: "email_not_syncing",
        label: "Email Not Syncing",
        aliases: [
          "emails not loading",
          "inbox not updating",
          "mail sync broken",
        ],
      },
      {
        id: "photo_cloud_sync",
        label: "Photos Not Syncing to Cloud",
        aliases: [
          "google photos not uploading",
          "icloud photos not syncing",
          "photo backup failed",
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Flat list — for simple autocomplete, all issues in one array
// ─────────────────────────────────────────────────────────────────────────────

export type FlatIssue = Issue & { categoryId: string; categoryLabel: string };

export const issuesFlatList: FlatIssue[] = issueCatalog.flatMap((category) =>
  category.issues.map((issue) => ({
    ...issue,
    categoryId: category.id,
    categoryLabel: category.label,
  })),
);

export default issueCatalog;
