// ─────────────────────────────────────────────────────────────────────────────
// Smartphone Repair Catalog — Reseller / Workshop Edition
// Includes major repairs, minor fixes, cleaning, and cosmetic restoration
//
// severity: 1–5  (mirrors issue severity — indicates repair complexity/cost tier)
//   1 = Trivial      (cleaning, screen protector, polish)
//   2 = Minor        (lens replacement, port cleaning, mesh replacement)
//   3 = Moderate     (battery, charging port, camera module, buttons)
//   4 = Major        (screen, back glass, frame, motherboard diagnostics)
//   5 = Complex      (motherboard repair, liquid damage, BGA rework, data recovery)
// ─────────────────────────────────────────────────────────────────────────────

export type Repair = {
  id: string;
  label: string;
  severity: 1 | 2 | 3 | 4 | 5;
  aliases?: string[];
};

export type RepairCategory = {
  id: string;
  label: string;
  repairs: Repair[];
};

export const repairCatalog: RepairCategory[] = [
  // ── Cleaning & Cosmetic ────────────────────────────────────────────────────
  {
    id: "cleaning_cosmetic",
    label: "Cleaning & Cosmetic",
    repairs: [
      {
        id: "full_device_clean",
        label: "Full Device Clean",
        severity: 1,
        aliases: ["phone cleaning", "deep clean", "device sanitise"],
      },
      {
        id: "screen_clean",
        label: "Screen Cleaning",
        severity: 1,
        aliases: ["clean display", "wipe screen", "screen polish"],
      },
      {
        id: "charging_port_clean",
        label: "Charging Port Cleaning",
        severity: 1,
        aliases: ["port cleaning", "lint removal port", "clean usb port"],
      },
      {
        id: "speaker_mesh_clean",
        label: "Speaker / Earpiece Mesh Cleaning",
        severity: 1,
        aliases: ["clean speaker grille", "unblock speaker", "mesh clean"],
      },
      {
        id: "camera_lens_clean",
        label: "Camera Lens Cleaning",
        severity: 1,
        aliases: ["clean camera", "wipe lens", "camera polish"],
      },
      {
        id: "headphone_jack_clean",
        label: "Headphone Jack Cleaning",
        severity: 1,
        aliases: ["clean aux port", "3.5mm cleaning", "jack debris removal"],
      },
      {
        id: "sim_tray_clean",
        label: "SIM Tray Cleaning",
        severity: 1,
        aliases: ["sim slot clean", "tray dust removal"],
      },
      {
        id: "sticker_residue_removal",
        label: "Sticker / Adhesive Residue Removal",
        severity: 1,
        aliases: ["remove sticker marks", "adhesive clean", "glue removal"],
      },
      {
        id: "frame_polish",
        label: "Frame / Rail Polish",
        severity: 1,
        aliases: ["buff frame", "polish sides", "scratch polish frame"],
      },
      {
        id: "back_panel_polish",
        label: "Back Panel Polish",
        severity: 1,
        aliases: ["polish rear", "buff back glass", "back scratch polish"],
      },
      {
        id: "screen_protector_install",
        label: "Screen Protector Installation",
        severity: 1,
        aliases: [
          "fit screen guard",
          "apply tempered glass",
          "install screen protector",
        ],
      },
      {
        id: "screen_protector_replace",
        label: "Screen Protector Replacement",
        severity: 1,
        aliases: [
          "replace screen guard",
          "new tempered glass",
          "swap screen protector",
        ],
      },
      {
        id: "screen_protector_remove",
        label: "Screen Protector Removal",
        severity: 1,
        aliases: [
          "remove screen guard",
          "peel off protector",
          "take off tempered glass",
        ],
      },
      {
        id: "dent_minor_cosmetic",
        label: "Minor Dent / Cosmetic Touch-Up",
        severity: 2,
        aliases: ["small dent repair", "cosmetic fix", "body touch up"],
      },
      {
        id: "oxidation_cleaning",
        label: "Oxidation / Tarnish Cleaning",
        severity: 2,
        aliases: ["clean oxidised frame", "remove tarnish", "metal clean"],
      },
    ],
  },

  // ── Screen & Display ───────────────────────────────────────────────────────
  {
    id: "screen_display",
    label: "Screen & Display",
    repairs: [
      {
        id: "screen_replacement",
        label: "Full Screen Assembly Replacement",
        severity: 4,
        aliases: [
          "lcd replacement",
          "display swap",
          "screen repair",
          "broken screen fix",
        ],
      },
      {
        id: "glass_only_replacement",
        label: "Front Glass Only Replacement",
        severity: 4,
        aliases: [
          "digitizer glass",
          "gorilla glass replacement",
          "front glass only",
        ],
      },
      {
        id: "lcd_replacement",
        label: "LCD Panel Replacement",
        severity: 4,
        aliases: ["display panel swap", "inner screen replacement"],
      },
      {
        id: "oled_replacement",
        label: "OLED / AMOLED Replacement",
        severity: 4,
        aliases: ["amoled swap", "super amoled repair", "dynamic amoled fix"],
      },
      {
        id: "touch_digitizer_repair",
        label: "Touch Digitizer Repair",
        severity: 4,
        aliases: ["digitizer fix", "touch layer replacement"],
      },
      {
        id: "proximity_sensor_repair",
        label: "Proximity Sensor Repair / Recalibration",
        severity: 3,
        aliases: [
          "sensor fix",
          "proximity recalibrate",
          "screen stays on call fix",
        ],
      },
      {
        id: "earpiece_mesh_replace",
        label: "Earpiece Mesh Replacement",
        severity: 2,
        aliases: [
          "replace speaker mesh",
          "new earpiece grille",
          "front mesh swap",
        ],
      },
      {
        id: "oleophobic_recoat",
        label: "Oleophobic Coating Reapplication",
        severity: 2,
        aliases: [
          "recoat screen",
          "anti-fingerprint reapply",
          "screen coating restore",
        ],
      },
    ],
  },

  // ── Battery ────────────────────────────────────────────────────────────────
  {
    id: "battery",
    label: "Battery",
    repairs: [
      {
        id: "battery_replacement",
        label: "Battery Replacement",
        severity: 3,
        aliases: ["new battery", "battery swap", "battery change"],
      },
      {
        id: "battery_health_check",
        label: "Battery Health Check / Diagnostic",
        severity: 1,
        aliases: ["check battery", "battery test", "battery capacity check"],
      },
      {
        id: "battery_calibration",
        label: "Battery Calibration",
        severity: 2,
        aliases: [
          "recalibrate battery",
          "battery percentage fix",
          "battery drain fix",
        ],
      },
    ],
  },

  // ── Charging Port & Connectors ─────────────────────────────────────────────
  {
    id: "charging_port",
    label: "Charging Port & Connectors",
    repairs: [
      {
        id: "charging_port_replacement",
        label: "Charging Port Replacement",
        severity: 3,
        aliases: [
          "usb port repair",
          "type-c port replacement",
          "lightning port fix",
          "micro usb fix",
        ],
      },
      {
        id: "charging_port_cleaning",
        label: "Charging Port Cleaning",
        severity: 1,
        aliases: ["lint removal", "clean charging port", "port unblock"],
      },
      {
        id: "headphone_jack_replacement",
        label: "Headphone Jack Replacement",
        severity: 3,
        aliases: [
          "audio jack repair",
          "3.5mm jack fix",
          "aux port replacement",
        ],
      },
      {
        id: "sim_tray_replacement",
        label: "SIM Card Tray Replacement",
        severity: 2,
        aliases: ["sim slot replacement", "new sim tray", "sim holder fix"],
      },
      {
        id: "sd_card_slot_repair",
        label: "SD Card Slot Repair",
        severity: 3,
        aliases: ["memory card slot fix", "microsd slot repair"],
      },
    ],
  },

  // ── Camera ─────────────────────────────────────────────────────────────────
  {
    id: "camera",
    label: "Camera",
    repairs: [
      {
        id: "rear_camera_replacement",
        label: "Rear Camera Module Replacement",
        severity: 3,
        aliases: [
          "back camera repair",
          "main camera fix",
          "primary camera swap",
        ],
      },
      {
        id: "front_camera_replacement",
        label: "Front Camera Replacement",
        severity: 3,
        aliases: ["selfie camera repair", "front camera fix"],
      },
      {
        id: "camera_lens_replacement",
        label: "Camera Lens Glass Replacement",
        severity: 2,
        aliases: ["cracked lens fix", "camera glass repair", "lens cover swap"],
      },
      {
        id: "camera_lens_clean_internal",
        label: "Camera Internal Dust Cleaning",
        severity: 2,
        aliases: [
          "remove dust from camera",
          "clean inside lens",
          "camera dust removal",
        ],
      },
      {
        id: "flash_repair",
        label: "Flash / Torch Repair",
        severity: 2,
        aliases: ["flashlight fix", "led flash repair", "torch fix"],
      },
      {
        id: "periscope_camera_repair",
        label: "Periscope / Telephoto Camera Repair",
        severity: 4,
        aliases: ["zoom lens repair", "telephoto fix", "optical zoom fix"],
      },
    ],
  },

  // ── Audio & Sound ──────────────────────────────────────────────────────────
  {
    id: "audio",
    label: "Audio & Sound",
    repairs: [
      {
        id: "earpiece_replacement",
        label: "Earpiece Speaker Replacement",
        severity: 3,
        aliases: ["call speaker repair", "top speaker fix", "ear speaker swap"],
      },
      {
        id: "loudspeaker_replacement",
        label: "Loudspeaker Replacement",
        severity: 3,
        aliases: [
          "bottom speaker repair",
          "external speaker fix",
          "loud speaker swap",
        ],
      },
      {
        id: "microphone_replacement",
        label: "Microphone Replacement",
        severity: 3,
        aliases: ["mic repair", "microphone fix", "mic swap"],
      },
      {
        id: "microphone_clean",
        label: "Microphone Cleaning",
        severity: 1,
        aliases: ["clean mic", "unblock microphone", "mic debris removal"],
      },
    ],
  },

  // ── Buttons & Controls ─────────────────────────────────────────────────────
  {
    id: "buttons",
    label: "Buttons & Controls",
    repairs: [
      {
        id: "power_button_repair",
        label: "Power Button Repair / Replacement",
        severity: 3,
        aliases: ["on/off button fix", "side button repair", "wake button fix"],
      },
      {
        id: "volume_button_repair",
        label: "Volume Button Repair / Replacement",
        severity: 3,
        aliases: ["volume key fix", "volume button swap"],
      },
      {
        id: "mute_switch_repair",
        label: "Mute / Silent Switch Repair",
        severity: 3,
        aliases: ["ringer switch fix", "mute toggle repair"],
      },
      {
        id: "home_button_repair",
        label: "Home Button Repair / Replacement",
        severity: 3,
        aliases: ["home key fix", "capacitive home repair"],
      },
      {
        id: "fingerprint_sensor_repair",
        label: "Fingerprint Sensor Repair",
        severity: 3,
        aliases: ["touch id fix", "biometric sensor repair"],
      },
      {
        id: "face_id_repair",
        label: "Face ID / Face Recognition Repair",
        severity: 4,
        aliases: ["face unlock fix", "dot projector repair", "face sensor fix"],
      },
      {
        id: "in_display_fp_repair",
        label: "In-Display Fingerprint Repair",
        severity: 3,
        aliases: ["under display fp fix", "optical fingerprint repair"],
      },
    ],
  },

  // ── Housing & Frame ────────────────────────────────────────────────────────
  {
    id: "housing",
    label: "Housing & Frame",
    repairs: [
      {
        id: "back_glass_replacement",
        label: "Back Glass Replacement",
        severity: 4,
        aliases: [
          "rear glass repair",
          "back cover fix",
          "back panel replacement",
        ],
      },
      {
        id: "back_cover_replacement",
        label: "Plastic Back Cover Replacement",
        severity: 3,
        aliases: ["battery cover swap", "rear panel fix"],
      },
      {
        id: "frame_replacement",
        label: "Frame / Chassis Replacement",
        severity: 4,
        aliases: ["mid frame repair", "housing swap", "chassis fix"],
      },
      {
        id: "frame_bend_repair",
        label: "Bent Frame Straightening",
        severity: 4,
        aliases: ["bent phone fix", "straighten frame", "warp repair"],
      },
      {
        id: "waterproofing_resealing",
        label: "Waterproofing Re-Sealing",
        severity: 3,
        aliases: [
          "ip seal repair",
          "water seal replacement",
          "adhesive resealing",
        ],
      },
      {
        id: "antenna_repair",
        label: "Antenna Repair / Replacement",
        severity: 4,
        aliases: [
          "signal antenna fix",
          "antenna band repair",
          "flex antenna swap",
        ],
      },
      {
        id: "screw_replacement",
        label: "Screw Replacement",
        severity: 1,
        aliases: ["replace missing screws", "new screws", "bottom screw fix"],
      },
    ],
  },

  // ── Connectivity ───────────────────────────────────────────────────────────
  {
    id: "connectivity",
    label: "Connectivity",
    repairs: [
      {
        id: "wifi_antenna_repair",
        label: "Wi-Fi Antenna Repair / Replacement",
        severity: 4,
        aliases: ["wifi fix", "wifi chip repair", "wireless antenna swap"],
      },
      {
        id: "bluetooth_repair",
        label: "Bluetooth Repair",
        severity: 4,
        aliases: ["bt fix", "bluetooth module repair"],
      },
      {
        id: "nfc_repair",
        label: "NFC Repair",
        severity: 3,
        aliases: ["nfc fix", "contactless repair", "nfc chip"],
      },
      {
        id: "5g_antenna_repair",
        label: "5G / 4G Antenna Repair",
        severity: 4,
        aliases: ["signal repair", "cellular antenna fix", "5g fix"],
      },
      {
        id: "gps_repair",
        label: "GPS Antenna Repair",
        severity: 3,
        aliases: ["location fix", "gps module repair"],
      },
    ],
  },

  // ── Software & System ──────────────────────────────────────────────────────
  {
    id: "software",
    label: "Software & System",
    repairs: [
      {
        id: "software_restore",
        label: "Software Restore / Reflash",
        severity: 3,
        aliases: ["factory reset", "reflash", "os reinstall", "software fix"],
      },
      {
        id: "bootloop_fix",
        label: "Bootloop Fix",
        severity: 4,
        aliases: [
          "stuck on logo fix",
          "boot loop repair",
          "infinite reboot fix",
        ],
      },
      {
        id: "virus_removal",
        label: "Virus / Malware Removal",
        severity: 3,
        aliases: ["remove virus", "malware clean", "phone security fix"],
      },
      {
        id: "icloud_unlock",
        label: "iCloud Activation Lock Removal",
        severity: 5,
        aliases: [
          "icloud unlock",
          "activation lock remove",
          "find my iphone unlock",
        ],
      },
      {
        id: "frp_bypass",
        label: "FRP / Google Account Lock Bypass",
        severity: 5,
        aliases: [
          "google lock remove",
          "frp unlock",
          "factory reset protection bypass",
        ],
      },
      {
        id: "network_unlock",
        label: "Network / Carrier Unlock",
        severity: 3,
        aliases: ["sim unlock", "carrier unlock", "unlock phone"],
      },
      {
        id: "password_recovery",
        label: "Password / PIN Recovery",
        severity: 4,
        aliases: ["forgot password fix", "locked out repair", "pin bypass"],
      },
      {
        id: "data_recovery",
        label: "Data Recovery",
        severity: 5,
        aliases: ["recover photos", "deleted files recovery", "data loss fix"],
      },
      {
        id: "data_transfer",
        label: "Data Transfer / Migration",
        severity: 2,
        aliases: [
          "backup restore",
          "phone migration",
          "move data",
          "transfer contacts",
        ],
      },
      {
        id: "software_update",
        label: "Software Update",
        severity: 1,
        aliases: ["os update", "firmware update", "system update"],
      },
      {
        id: "imei_repair",
        label: "IMEI Repair / Restore",
        severity: 5,
        aliases: ["fix imei", "restore imei", "imei null fix"],
      },
    ],
  },

  // ── Liquid Damage ──────────────────────────────────────────────────────────
  {
    id: "liquid_damage",
    label: "Liquid & Physical Damage",
    repairs: [
      {
        id: "liquid_damage_treatment",
        label: "Liquid Damage Treatment",
        severity: 5,
        aliases: ["water damage repair", "wet phone fix", "moisture treatment"],
      },
      {
        id: "corrosion_cleaning",
        label: "Corrosion / Board Cleaning",
        severity: 5,
        aliases: [
          "corroded board clean",
          "rust removal board",
          "oxidation cleaning pcb",
        ],
      },
      {
        id: "ultrasonic_cleaning",
        label: "Ultrasonic Board Cleaning",
        severity: 5,
        aliases: ["ultrasonic clean", "board deep clean", "pcb ultrasonic"],
      },
    ],
  },

  // ── Motherboard & Advanced ─────────────────────────────────────────────────
  {
    id: "motherboard",
    label: "Motherboard & Advanced",
    repairs: [
      {
        id: "motherboard_diagnostic",
        label: "Motherboard Diagnostic",
        severity: 4,
        aliases: ["board check", "logic board diagnosis", "motherboard test"],
      },
      {
        id: "ic_chip_repair",
        label: "IC Chip Repair / Replacement",
        severity: 5,
        aliases: ["chip level repair", "ic repair", "component repair"],
      },
      {
        id: "bga_rework",
        label: "BGA Rework / Reballing",
        severity: 5,
        aliases: ["bga repair", "reballing", "ball grid array rework"],
      },
      {
        id: "power_ic_repair",
        label: "Power IC / PMIC Repair",
        severity: 5,
        aliases: ["pmic fix", "power management ic", "charging ic repair"],
      },
      {
        id: "touch_ic_repair",
        label: "Touch IC Repair",
        severity: 5,
        aliases: ["touch controller ic", "digitizer ic fix"],
      },
      {
        id: "wifi_ic_repair",
        label: "Wi-Fi / Bluetooth IC Repair",
        severity: 5,
        aliases: ["wifi chip fix", "bt ic repair"],
      },
      {
        id: "nand_repair",
        label: "NAND / Storage Chip Repair",
        severity: 5,
        aliases: ["storage ic fix", "nand flash repair", "emmc repair"],
      },
      {
        id: "baseband_repair",
        label: "Baseband / Modem Repair",
        severity: 5,
        aliases: ["modem fix", "baseband chip repair", "no signal chip fix"],
      },
      {
        id: "motherboard_replacement",
        label: "Motherboard Replacement",
        severity: 5,
        aliases: ["logic board swap", "main board replacement"],
      },
    ],
  },

  // ── Foldable Phone ─────────────────────────────────────────────────────────
  {
    id: "foldable",
    label: "Foldable Phone",
    repairs: [
      {
        id: "inner_screen_fold_replace",
        label: "Inner Foldable Screen Replacement",
        severity: 5,
        aliases: [
          "fold screen fix",
          "inner display repair",
          "main fold display swap",
        ],
      },
      {
        id: "cover_screen_fold_replace",
        label: "Cover Screen Replacement",
        severity: 4,
        aliases: ["outer screen fix", "external display swap"],
      },
      {
        id: "hinge_repair",
        label: "Hinge Repair",
        severity: 4,
        aliases: ["fold hinge fix", "flip hinge repair", "hinge service"],
      },
      {
        id: "hinge_replacement",
        label: "Hinge Replacement",
        severity: 4,
        aliases: ["new hinge", "hinge swap", "full hinge replace"],
      },
      {
        id: "utg_replacement",
        label: "UTG / Screen Film Replacement",
        severity: 3,
        aliases: [
          "ultra thin glass swap",
          "screen film fix",
          "protective film replace",
        ],
      },
      {
        id: "fold_resealing",
        label: "Fold Waterproof Re-Sealing",
        severity: 3,
        aliases: ["fold seal repair", "foldable ip seal", "hinge waterproof"],
      },
    ],
  },

  // ── Diagnostics & Other ────────────────────────────────────────────────────
  {
    id: "diagnostics_other",
    label: "Diagnostics & Other",
    repairs: [
      {
        id: "full_diagnostic",
        label: "Full Device Diagnostic",
        severity: 1,
        aliases: [
          "check phone",
          "device inspection",
          "health check",
          "full test",
        ],
      },
      {
        id: "vibration_motor_repair",
        label: "Vibration Motor Repair / Replacement",
        severity: 3,
        aliases: [
          "haptic motor fix",
          "no vibration repair",
          "taptic engine fix",
        ],
      },
      {
        id: "stylus_repair",
        label: "S Pen / Stylus Repair",
        severity: 3,
        aliases: ["s pen fix", "stylus broken repair", "pen not working fix"],
      },
      {
        id: "stylus_silo_repair",
        label: "Stylus Silo / Slot Repair",
        severity: 3,
        aliases: ["s pen slot fix", "stylus slot repair"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Flat list — for autocomplete
// ─────────────────────────────────────────────────────────────────────────────

export type FlatRepair = Repair & { categoryId: string; categoryLabel: string };

export const repairsFlatList: FlatRepair[] = repairCatalog.flatMap((category) =>
  category.repairs.map((repair) => ({
    ...repair,
    categoryId: category.id,
    categoryLabel: category.label,
  })),
);

// ─────────────────────────────────────────────────────────────────────────────
// Severity colour map — mirrors issueCatalog for consistent UI
// ─────────────────────────────────────────────────────────────────────────────

export const severityColorMap: Record<
  1 | 2 | 3 | 4 | 5,
  { bg: string; text: string; label: string }
> = {
  1: { bg: "#F0FDF4", text: "#166534", label: "Trivial" },
  2: { bg: "#FEF9C3", text: "#854D0E", label: "Minor" },
  3: { bg: "#FFF7ED", text: "#9A3412", label: "Moderate" },
  4: { bg: "#FEF2F2", text: "#991B1B", label: "Major" },
  5: { bg: "#450A0A", text: "#FEF2F2", label: "Complex" },
};

export default repairCatalog;
