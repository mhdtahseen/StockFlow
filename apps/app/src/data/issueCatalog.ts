// ─────────────────────────────────────────────────────────────────────────────
// Smartphone Issues Catalog — Reseller / Appraisal Edition
// Includes functional faults, cosmetic defects, and minor blemishes
//
// severity: 1–5
//   1 = Cosmetic / negligible  (hairline scratch, minor scuff)
//   2 = Minor defect            (dust in camera, small chip)
//   3 = Moderate fault          (touch issues, battery drain)
//   4 = Serious fault           (no signal, bootloop)
//   5 = Critical                (no power, liquid damage, motherboard)
// ─────────────────────────────────────────────────────────────────────────────

export type Issue = {
  id: string;
  label: string;
  severity: 1 | 2 | 3 | 4 | 5;
  aliases?: string[];
};

export type IssueCategory = {
  id: string;
  label: string;
  issues: Issue[];
};

export const issueCatalog: IssueCategory[] = [
  // ── Cosmetic & Blemishes ───────────────────────────────────────────────────
  {
    id: "cosmetic_blemishes",
    label: "Cosmetic & Blemishes",
    issues: [
      {
        id: "hairline_scratch_screen",
        label: "Hairline Scratch on Screen",
        severity: 1,
        aliases: ["micro scratch", "fine scratch", "light scratch screen"],
      },
      {
        id: "deep_scratch_screen",
        label: "Deep Scratch on Screen",
        severity: 2,
        aliases: [
          "visible scratch screen",
          "gouge screen",
          "scratched display",
        ],
      },
      {
        id: "scratch_back",
        label: "Scratch on Back / Rear",
        severity: 1,
        aliases: ["scratched back glass", "rear scratch", "back panel scratch"],
      },
      {
        id: "scratch_frame",
        label: "Scratch on Frame / Rails",
        severity: 1,
        aliases: ["frame scratch", "scratched sides", "rail scratch"],
      },
      {
        id: "scuff_mark",
        label: "Scuff Marks",
        severity: 1,
        aliases: ["scuffs", "paint wear", "surface scuff"],
      },
      {
        id: "dent_frame",
        label: "Dent on Frame",
        severity: 2,
        aliases: ["frame dent", "ding", "corner dent", "impact dent"],
      },
      {
        id: "chip_corner",
        label: "Chipped Corner",
        severity: 2,
        aliases: ["corner chip", "edge chip", "glass chip corner"],
      },
      {
        id: "chip_screen_edge",
        label: "Chipped Screen Edge",
        severity: 2,
        aliases: [
          "edge chip screen",
          "corner glass missing",
          "display edge chip",
        ],
      },
      {
        id: "crack_back_minor",
        label: "Minor Crack on Back Glass",
        severity: 2,
        aliases: [
          "small crack back",
          "hairline crack rear",
          "back glass crack",
        ],
      },
      {
        id: "crack_back_major",
        label: "Shattered Back Glass",
        severity: 3,
        aliases: [
          "broken back glass",
          "smashed rear glass",
          "back completely cracked",
        ],
      },
      {
        id: "paint_peeling",
        label: "Paint / Coating Peeling",
        severity: 2,
        aliases: ["coating flaking", "colour peeling", "anodising wear"],
      },
      {
        id: "discolouration_body",
        label: "Body Discolouration / Yellowing",
        severity: 1,
        aliases: ["yellowed plastic", "plastic yellowing", "discoloured back"],
      },
      {
        id: "worn_logo",
        label: "Logo / Branding Worn Off",
        severity: 1,
        aliases: ["apple logo worn", "samsung logo faded", "brand mark gone"],
      },
      {
        id: "sticky_residue",
        label: "Sticky Residue / Sticker Marks",
        severity: 1,
        aliases: [
          "glue residue",
          "sticker mark",
          "adhesive residue",
          "tape mark",
        ],
      },
      {
        id: "worn_buttons",
        label: "Worn / Faded Buttons",
        severity: 1,
        aliases: ["button label worn", "faded power button", "worn volume key"],
      },
      {
        id: "dirt_buildup",
        label: "Dirt / Grime Buildup",
        severity: 1,
        aliases: [
          "dirty phone",
          "grime in ports",
          "filthy device",
          "built up dirt",
        ],
      },
      {
        id: "oxidation_frame",
        label: "Oxidation / Tarnish on Frame",
        severity: 2,
        aliases: ["oxidised metal", "tarnished frame", "frame discolouration"],
      },
      {
        id: "bend_slight",
        label: "Slight Bend / Warp",
        severity: 2,
        aliases: ["slightly bent", "minor warp", "barely bent frame"],
      },
      {
        id: "burn_mark_body",
        label: "Burn Mark on Body",
        severity: 3,
        aliases: ["scorch mark", "heat mark", "burnt casing"],
      },
      {
        id: "missing_accessories",
        label: "Missing Accessories / Packaging",
        severity: 1,
        aliases: ["no box", "no charger", "no earphones", "incomplete package"],
      },
      {
        id: "previously_repaired",
        label: "Evidence of Previous Repair",
        severity: 2,
        aliases: [
          "third party repair",
          "non-original parts",
          "repaired before",
          "aftermarket screen",
        ],
      },
      {
        id: "non_genuine_parts",
        label: "Non-Genuine / Aftermarket Parts Fitted",
        severity: 3,
        aliases: [
          "fake screen",
          "third party battery",
          "non-oem parts",
          "clone parts",
        ],
      },
      {
        id: "missing_screws",
        label: "Missing Screws",
        severity: 2,
        aliases: ["screw missing", "no screws", "loose bottom screws"],
      },
      {
        id: "sim_tray_damaged",
        label: "SIM Tray Damaged / Missing",
        severity: 2,
        aliases: ["sim slot broken", "sim ejector missing", "sim tray bent"],
      },
    ],
  },

  // ── Screen & Display ───────────────────────────────────────────────────────
  {
    id: "screen_display",
    label: "Screen & Display",
    issues: [
      {
        id: "cracked_screen",
        label: "Cracked / Shattered Screen",
        severity: 3,
        aliases: ["broken screen", "smashed screen", "shattered display"],
      },
      {
        id: "broken_lcd",
        label: "Broken LCD / Black Blotch",
        severity: 4,
        aliases: ["black spot", "ink spot", "lcd damage", "dark patch"],
      },
      {
        id: "screen_not_turning_on",
        label: "Screen Not Turning On",
        severity: 5,
        aliases: ["black screen", "blank display", "screen won't turn on"],
      },
      {
        id: "touch_unresponsive",
        label: "Touchscreen Not Responding",
        severity: 4,
        aliases: [
          "touch not working",
          "unresponsive touch",
          "screen not sensitive",
        ],
      },
      {
        id: "touch_ghost",
        label: "Ghost Touch / Phantom Inputs",
        severity: 3,
        aliases: ["screen touching itself", "random taps", "phantom touch"],
      },
      {
        id: "screen_flickering",
        label: "Screen Flickering",
        severity: 3,
        aliases: ["flashing screen", "blinking display", "screen blink"],
      },
      {
        id: "lines_on_screen",
        label: "Lines on Screen",
        severity: 4,
        aliases: ["horizontal lines", "vertical lines", "stripes on display"],
      },
      {
        id: "dead_pixels",
        label: "Dead / Stuck Pixels",
        severity: 2,
        aliases: ["pixel dot", "stuck pixel", "white dot", "dead spot"],
      },
      {
        id: "screen_burn_in",
        label: "Screen Burn-In",
        severity: 3,
        aliases: ["ghost image", "image retention", "permanent image"],
      },
      {
        id: "screen_discolouration",
        label: "Screen Discolouration / Tint",
        severity: 2,
        aliases: ["yellow tint", "green tint", "pink tint"],
      },
      {
        id: "screen_dim",
        label: "Screen Too Dim",
        severity: 2,
        aliases: ["low brightness", "dark display", "not bright enough"],
      },
      {
        id: "dust_under_screen",
        label: "Dust Under Screen",
        severity: 2,
        aliases: [
          "dust behind glass",
          "particle under display",
          "dust spot screen",
        ],
      },
      {
        id: "water_mark_screen",
        label: "Water Mark / Moisture Under Screen",
        severity: 3,
        aliases: [
          "moisture under display",
          "condensation screen",
          "water spot display",
        ],
      },
      {
        id: "screen_protector_cracked",
        label: "Screen Protector Cracked / Lifting",
        severity: 1,
        aliases: [
          "tempered glass cracked",
          "protector lifting",
          "screen guard broken",
        ],
      },
      {
        id: "oleophobic_worn",
        label: "Oleophobic Coating Worn Off",
        severity: 1,
        aliases: ["fingerprint coating gone", "smudgy screen", "oily screen"],
      },
      {
        id: "proximity_sensor_issue",
        label: "Proximity Sensor Not Working",
        severity: 3,
        aliases: ["screen stays on during call", "proximity sensor broken"],
      },
      {
        id: "earpiece_mesh_blocked",
        label: "Earpiece Mesh Blocked / Dirty",
        severity: 1,
        aliases: [
          "top speaker dirty",
          "earpiece clogged",
          "speaker grille blocked",
        ],
      },
      {
        id: "auto_brightness_issue",
        label: "Auto-Brightness Not Working",
        severity: 2,
        aliases: ["brightness sensor broken", "adaptive brightness issue"],
      },
      {
        id: "refresh_rate_issue",
        label: "Display Stutter / Refresh Rate Issue",
        severity: 2,
        aliases: ["choppy scrolling", "stuttery display", "120hz not working"],
      },
    ],
  },

  // ── Camera ─────────────────────────────────────────────────────────────────
  {
    id: "camera_issues",
    label: "Camera",
    issues: [
      {
        id: "dust_in_camera",
        label: "Dust Inside Rear Camera Lens",
        severity: 2,
        aliases: [
          "dust spot camera",
          "particle in lens",
          "dirt in camera module",
        ],
      },
      {
        id: "dust_front_camera",
        label: "Dust Inside Front Camera",
        severity: 2,
        aliases: ["selfie cam dusty", "front lens dirty", "dust selfie camera"],
      },
      {
        id: "camera_lens_cracked",
        label: "Camera Lens Glass Cracked",
        severity: 2,
        aliases: ["cracked camera glass", "lens cover broken"],
      },
      {
        id: "camera_lens_scratched",
        label: "Camera Lens Scratched",
        severity: 2,
        aliases: [
          "lens scratch",
          "scratched camera cover",
          "camera glass mark",
        ],
      },
      {
        id: "condensation_camera",
        label: "Condensation Inside Camera",
        severity: 3,
        aliases: ["fogged camera", "moisture in lens", "foggy camera module"],
      },
      {
        id: "camera_not_opening",
        label: "Camera App Not Opening",
        severity: 3,
        aliases: ["camera crash", "camera app fails", "camera force close"],
      },
      {
        id: "camera_black_screen",
        label: "Camera Shows Black Screen",
        severity: 4,
        aliases: ["camera blank", "camera no preview", "camera not showing"],
      },
      {
        id: "camera_blurry",
        label: "Camera Taking Blurry Photos",
        severity: 3,
        aliases: ["out of focus", "blurry pictures", "camera not sharp"],
      },
      {
        id: "autofocus_not_working",
        label: "Autofocus Not Working",
        severity: 3,
        aliases: ["won't focus", "focus stuck", "manual focus only"],
      },
      {
        id: "camera_lines_artifacts",
        label: "Lines / Artifacts in Camera",
        severity: 3,
        aliases: ["camera distortion", "lines in viewfinder", "camera noise"],
      },
      {
        id: "flash_not_working",
        label: "Flash / Torch Not Working",
        severity: 2,
        aliases: ["flashlight broken", "led flash not working", "torch not on"],
      },
      {
        id: "camera_shaking",
        label: "Camera Shaky / OIS Not Working",
        severity: 3,
        aliases: [
          "ois broken",
          "shaky photos",
          "image stabilisation not working",
        ],
      },
      {
        id: "zoom_not_working",
        label: "Zoom / Telephoto Not Working",
        severity: 3,
        aliases: ["telephoto broken", "optical zoom issue", "periscope issue"],
      },
      {
        id: "front_camera_issue",
        label: "Front Camera Not Working",
        severity: 4,
        aliases: ["selfie camera broken", "front facing camera issue"],
      },
      {
        id: "rear_camera_issue",
        label: "Rear Camera Not Working",
        severity: 4,
        aliases: ["back camera broken", "main camera not working"],
      },
    ],
  },

  // ── Battery & Power ────────────────────────────────────────────────────────
  {
    id: "battery_power",
    label: "Battery & Power",
    issues: [
      {
        id: "battery_draining_fast",
        label: "Battery Draining Fast",
        severity: 3,
        aliases: ["poor battery life", "battery dies quickly", "short battery"],
      },
      {
        id: "phone_not_charging",
        label: "Phone Not Charging",
        severity: 4,
        aliases: ["won't charge", "no charge", "not charging at all"],
      },
      {
        id: "slow_charging",
        label: "Charging Slowly",
        severity: 3,
        aliases: [
          "slow charge",
          "takes long to charge",
          "fast charge not working",
        ],
      },
      {
        id: "wireless_charging_fail",
        label: "Wireless Charging Not Working",
        severity: 3,
        aliases: ["qi not working", "inductive charging broken"],
      },
      {
        id: "overheating",
        label: "Phone Overheating",
        severity: 4,
        aliases: ["phone too hot", "heating up", "thermal throttle"],
      },
      {
        id: "battery_swollen",
        label: "Swollen / Bloated Battery",
        severity: 5,
        aliases: ["puffed battery", "bulging battery", "swelled battery"],
      },
      {
        id: "phone_not_turning_on",
        label: "Phone Not Turning On",
        severity: 5,
        aliases: [
          "dead phone",
          "won't power on",
          "no power",
          "black screen of death",
        ],
      },
      {
        id: "phone_randomly_shuts_off",
        label: "Phone Randomly Shuts Off",
        severity: 4,
        aliases: [
          "turns off by itself",
          "random shutdown",
          "spontaneous reboot",
        ],
      },
      {
        id: "battery_percentage_jump",
        label: "Battery Percentage Jumping / Inaccurate",
        severity: 3,
        aliases: [
          "inaccurate battery",
          "battery drops suddenly",
          "jumps from 20 to dead",
        ],
      },
      {
        id: "charging_port_loose",
        label: "Charging Port Loose / Wobbly",
        severity: 3,
        aliases: ["cable falls out", "port not gripping", "loose usb"],
      },
      {
        id: "charging_port_dirty",
        label: "Charging Port Dirty / Blocked",
        severity: 2,
        aliases: ["lint in port", "fluff in charger", "debris in port"],
      },
    ],
  },

  // ── Audio & Sound ──────────────────────────────────────────────────────────
  {
    id: "audio_sound",
    label: "Audio & Sound",
    issues: [
      {
        id: "no_sound",
        label: "No Sound / Audio Output",
        severity: 4,
        aliases: ["silent phone", "no audio", "muted"],
      },
      {
        id: "loudspeaker_not_working",
        label: "Loudspeaker Not Working",
        severity: 4,
        aliases: ["bottom speaker broken", "external speaker dead"],
      },
      {
        id: "earpiece_not_working",
        label: "Earpiece Not Working",
        severity: 4,
        aliases: ["can't hear on calls", "top speaker broken"],
      },
      {
        id: "distorted_audio",
        label: "Distorted / Crackling Sound",
        severity: 3,
        aliases: ["buzzing speaker", "crackling audio", "muffled sound"],
      },
      {
        id: "microphone_not_working",
        label: "Microphone Not Working",
        severity: 4,
        aliases: ["mic dead", "caller can't hear me", "no mic"],
      },
      {
        id: "muffled_microphone",
        label: "Muffled Microphone",
        severity: 3,
        aliases: ["mic muffled", "bad mic quality", "voice unclear"],
      },
      {
        id: "speaker_mesh_dirty",
        label: "Speaker Mesh Dirty / Blocked",
        severity: 1,
        aliases: ["clogged speaker grille", "dirty mesh", "blocked speaker"],
      },
      {
        id: "headphone_jack_issue",
        label: "Headphone Jack Issue",
        severity: 3,
        aliases: ["aux not working", "3.5mm broken", "earphones not detected"],
      },
      {
        id: "volume_buttons_not_working",
        label: "Volume Buttons Not Working",
        severity: 3,
        aliases: ["can't adjust volume", "volume key stuck", "volume broken"],
      },
    ],
  },

  // ── Connectivity ───────────────────────────────────────────────────────────
  {
    id: "connectivity",
    label: "Connectivity",
    issues: [
      {
        id: "no_signal",
        label: "No Mobile Signal",
        severity: 4,
        aliases: ["no network", "no bars", "no service"],
      },
      {
        id: "weak_signal",
        label: "Weak / Dropping Signal",
        severity: 3,
        aliases: ["low signal", "dropped calls", "poor reception"],
      },
      {
        id: "wifi_not_connecting",
        label: "Wi-Fi Not Connecting",
        severity: 3,
        aliases: ["wifi broken", "can't join wifi"],
      },
      {
        id: "wifi_dropping",
        label: "Wi-Fi Keeps Dropping",
        severity: 3,
        aliases: ["wifi disconnects", "unstable wifi"],
      },
      {
        id: "bluetooth_not_connecting",
        label: "Bluetooth Not Connecting",
        severity: 3,
        aliases: ["bt not pairing", "bluetooth broken"],
      },
      {
        id: "nfc_not_working",
        label: "NFC Not Working",
        severity: 3,
        aliases: ["contactless payment broken", "tap to pay not working"],
      },
      {
        id: "5g_not_working",
        label: "5G Not Working",
        severity: 3,
        aliases: ["5g broken", "stuck on 4g", "no 5g signal"],
      },
      {
        id: "mobile_data_not_working",
        label: "Mobile Data Not Working",
        severity: 4,
        aliases: ["internet not working", "data not connecting"],
      },
      {
        id: "gps_not_working",
        label: "GPS / Location Not Working",
        severity: 3,
        aliases: ["maps not accurate", "location off", "gps fix slow"],
      },
      {
        id: "sim_not_detected",
        label: "SIM Card Not Detected",
        severity: 4,
        aliases: ["no sim", "sim not reading", "invalid sim", "sim error"],
      },
      {
        id: "airplane_mode_stuck",
        label: "Stuck in Airplane Mode",
        severity: 4,
        aliases: ["can't turn off airplane mode"],
      },
    ],
  },

  // ── Software & System ──────────────────────────────────────────────────────
  {
    id: "software_system",
    label: "Software & System",
    issues: [
      {
        id: "phone_slow",
        label: "Phone Slow / Lagging",
        severity: 3,
        aliases: ["sluggish phone", "performance issue", "running slow"],
      },
      {
        id: "apps_crashing",
        label: "Apps Crashing / Force Closing",
        severity: 3,
        aliases: ["app keeps stopping", "app crash", "force close"],
      },
      {
        id: "bootloop",
        label: "Stuck in Bootloop",
        severity: 5,
        aliases: ["stuck on logo", "keeps restarting", "infinite reboot"],
      },
      {
        id: "phone_freezing",
        label: "Phone Freezing / Unresponsive",
        severity: 4,
        aliases: ["frozen screen", "phone hung", "completely unresponsive"],
      },
      {
        id: "random_restarts",
        label: "Random Restarts",
        severity: 4,
        aliases: ["phone rebooting itself", "spontaneous restart"],
      },
      {
        id: "update_failed",
        label: "Software Update Failed / Stuck",
        severity: 4,
        aliases: ["update error", "os update stuck", "firmware fail"],
      },
      {
        id: "storage_full",
        label: "Storage Full",
        severity: 2,
        aliases: ["no storage", "not enough space", "memory full"],
      },
      {
        id: "notifications_not_working",
        label: "Notifications Not Working",
        severity: 2,
        aliases: ["no notifications", "missing notifications"],
      },
      {
        id: "imei_issue",
        label: "IMEI Issue / Invalid / Blacklisted",
        severity: 5,
        aliases: [
          "no imei",
          "imei null",
          "invalid imei",
          "imei blacklisted",
          "barred imei",
        ],
      },
      {
        id: "date_time_wrong",
        label: "Date / Time Incorrect",
        severity: 1,
        aliases: ["wrong time", "clock wrong", "date incorrect"],
      },
    ],
  },

  // ── Security & Access ──────────────────────────────────────────────────────
  {
    id: "security_access",
    label: "Security & Access",
    issues: [
      {
        id: "fingerprint_not_working",
        label: "Fingerprint Sensor Not Working",
        severity: 3,
        aliases: [
          "fingerprint broken",
          "touch id failing",
          "biometric not recognising",
        ],
      },
      {
        id: "face_unlock_not_working",
        label: "Face Unlock Not Working",
        severity: 3,
        aliases: ["face id broken", "face recognition failing"],
      },
      {
        id: "locked_out",
        label: "Locked Out of Phone",
        severity: 4,
        aliases: ["forgot pin", "forgot password", "forgot pattern"],
      },
      {
        id: "icloud_lock",
        label: "iCloud Activation Lock",
        severity: 5,
        aliases: ["find my iphone lock", "icloud locked", "activation locked"],
      },
      {
        id: "google_frp_lock",
        label: "Google FRP / Account Lock",
        severity: 5,
        aliases: [
          "factory reset protection",
          "frp bypass",
          "google account lock",
        ],
      },
      {
        id: "network_locked",
        label: "Network / Carrier Locked",
        severity: 3,
        aliases: ["sim locked", "carrier locked", "not accepting sim"],
      },
      {
        id: "virus_malware",
        label: "Virus / Malware Suspected",
        severity: 4,
        aliases: ["phone hacked", "malware on phone", "suspicious app"],
      },
    ],
  },

  // ── Buttons & Biometrics ───────────────────────────────────────────────────
  {
    id: "buttons_biometrics",
    label: "Buttons & Biometrics",
    issues: [
      {
        id: "power_button_stuck",
        label: "Power Button Stuck / Not Working",
        severity: 4,
        aliases: [
          "on/off stuck",
          "side button broken",
          "power key not pressing",
        ],
      },
      {
        id: "volume_button_stuck",
        label: "Volume Button Stuck / Not Working",
        severity: 3,
        aliases: ["volume key stuck", "volume button broken"],
      },
      {
        id: "home_button_broken",
        label: "Home Button Not Working",
        severity: 4,
        aliases: ["home key broken", "capacitive home broken"],
      },
      {
        id: "mute_switch_broken",
        label: "Mute / Silent Switch Broken",
        severity: 3,
        aliases: ["ringer switch broken", "silent toggle stuck"],
      },
      {
        id: "in_display_fingerprint",
        label: "In-Display Fingerprint Not Working",
        severity: 3,
        aliases: ["under display fingerprint", "optical fingerprint broken"],
      },
      {
        id: "button_wobbly",
        label: "Button Loose / Wobbly",
        severity: 2,
        aliases: [
          "rattly button",
          "loose power key",
          "button not clicking properly",
        ],
      },
    ],
  },

  // ── Physical & Liquid Damage ───────────────────────────────────────────────
  {
    id: "physical_damage",
    label: "Physical & Liquid Damage",
    issues: [
      {
        id: "water_damage",
        label: "Water / Liquid Damage",
        severity: 5,
        aliases: ["dropped in water", "wet phone", "liquid damage"],
      },
      {
        id: "water_indicator_triggered",
        label: "Water Damage Indicator Triggered",
        severity: 4,
        aliases: ["wdi red", "liquid indicator activated", "water sticker red"],
      },
      {
        id: "corrosion",
        label: "Corrosion / Oxidation on Board",
        severity: 5,
        aliases: ["corroded board", "rust", "green corrosion", "oxidation"],
      },
      {
        id: "dropped_phone",
        label: "Phone Dropped / Impact Damage",
        severity: 3,
        aliases: ["fell on floor", "dropped", "fall damage"],
      },
      {
        id: "bent_phone",
        label: "Bent / Warped Frame",
        severity: 3,
        aliases: ["phone bent", "chassis warped", "curved frame"],
      },
      {
        id: "sand_dust_ingress",
        label: "Sand / Dust Ingress Inside Phone",
        severity: 3,
        aliases: ["dust inside phone", "sand damage", "grit inside device"],
      },
      {
        id: "water_resistant_seal_broken",
        label: "Water-Resistant Seal Compromised",
        severity: 3,
        aliases: ["ip rating lost", "seal broken", "no longer waterproof"],
      },
      {
        id: "phone_run_over",
        label: "Phone Run Over / Severely Crushed",
        severity: 5,
        aliases: ["car ran over phone", "crushed phone", "severe damage"],
      },
      {
        id: "rattle_inside",
        label: "Rattle / Loose Component Inside",
        severity: 3,
        aliases: [
          "rattling phone",
          "loose part inside",
          "something loose inside",
        ],
      },
    ],
  },

  // ── Foldable Phone ─────────────────────────────────────────────────────────
  {
    id: "foldable_specific",
    label: "Foldable Phone",
    issues: [
      {
        id: "hinge_stiff",
        label: "Hinge Stiff / Hard to Open",
        severity: 3,
        aliases: ["fold hard to open", "stiff hinge", "flip hard to open"],
      },
      {
        id: "hinge_loose",
        label: "Hinge Loose / Wobbly",
        severity: 3,
        aliases: ["loose hinge", "floppy hinge", "fold not staying open"],
      },
      {
        id: "hinge_creak",
        label: "Hinge Creaking / Grinding",
        severity: 2,
        aliases: ["hinge noise", "creak when folding", "grinding hinge"],
      },
      {
        id: "hinge_gap",
        label: "Gap / Misalignment at Hinge",
        severity: 2,
        aliases: ["hinge uneven", "fold gap", "asymmetric fold"],
      },
      {
        id: "inner_screen_cracked",
        label: "Inner Foldable Screen Cracked",
        severity: 5,
        aliases: ["fold screen cracked", "main screen broken"],
      },
      {
        id: "fold_crease_severe",
        label: "Fold Crease Deep / Visible",
        severity: 2,
        aliases: ["screen crease", "fold line visible", "middle crease deep"],
      },
      {
        id: "cover_screen_cracked",
        label: "Cover Screen Cracked",
        severity: 3,
        aliases: ["outer screen broken", "external display cracked"],
      },
      {
        id: "fold_not_flat",
        label: "Phone Not Folding / Closing Flat",
        severity: 3,
        aliases: ["won't close fully", "gap when closed", "doesn't lay flat"],
      },
      {
        id: "utg_peeling",
        label: "Screen Film / UTG Peeling",
        severity: 2,
        aliases: [
          "film peeling",
          "screen layer lifting",
          "ultra thin glass peeling",
        ],
      },
    ],
  },

  // ── Miscellaneous ──────────────────────────────────────────────────────────
  {
    id: "miscellaneous",
    label: "Miscellaneous",
    issues: [
      {
        id: "vibration_weak",
        label: "Vibration Weak / Not Working",
        severity: 2,
        aliases: ["haptic broken", "no vibration", "vibrate not working"],
      },
      {
        id: "stylus_not_working",
        label: "S Pen / Stylus Not Working",
        severity: 3,
        aliases: ["s pen broken", "stylus unresponsive", "pen not detected"],
      },
      {
        id: "calls_dropping",
        label: "Calls Dropping / Cutting Out",
        severity: 4,
        aliases: ["call drops", "disconnected calls"],
      },
      {
        id: "sms_not_sending",
        label: "SMS / Text Messages Not Sending",
        severity: 3,
        aliases: ["texts not going through", "messages failing"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Flat list — for autocomplete
// ─────────────────────────────────────────────────────────────────────────────

export type FlatIssue = Issue & { categoryId: string; categoryLabel: string };

export const issuesFlatList: FlatIssue[] = issueCatalog.flatMap((category) =>
  category.issues.map((issue) => ({
    ...issue,
    categoryId: category.id,
    categoryLabel: category.label,
  })),
);

// ─────────────────────────────────────────────────────────────────────────────
// Severity colour map — for UI colour coordination
// ─────────────────────────────────────────────────────────────────────────────

export const severityColorMap: Record<
  1 | 2 | 3 | 4 | 5,
  { bg: string; text: string; label: string }
> = {
  1: { bg: "#F0FDF4", text: "#166534", label: "Negligible" },
  2: { bg: "#FEF9C3", text: "#854D0E", label: "Minor" },
  3: { bg: "#FFF7ED", text: "#9A3412", label: "Moderate" },
  4: { bg: "#FEF2F2", text: "#991B1B", label: "Serious" },
  5: { bg: "#450A0A", text: "#FEF2F2", label: "Critical" },
};

export default issueCatalog;
