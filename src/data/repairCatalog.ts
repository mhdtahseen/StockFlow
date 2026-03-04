// ─────────────────────────────────────────────────────────────────────────────
// Smartphone Repair Catalog
// Structured for autocomplete: category → repairs[]
// Each repair has a unique id, display label, and optional aliases for fuzzy search
// ─────────────────────────────────────────────────────────────────────────────

export type Repair = {
  id: string;
  label: string;
  aliases?: string[]; // alternative search terms
};

export type RepairCategory = {
  id: string;
  label: string;
  repairs: Repair[];
};

export const repairCatalog: RepairCategory[] = [
  {
    id: "screen",
    label: "Screen & Display",
    repairs: [
      {
        id: "screen_replacement",
        label: "Screen Replacement",
        aliases: [
          "lcd",
          "display",
          "broken screen",
          "cracked screen",
          "shattered",
        ],
      },
      {
        id: "glass_only",
        label: "Front Glass Replacement",
        aliases: ["digitizer glass", "gorilla glass", "front glass"],
      },
      {
        id: "lcd_replacement",
        label: "LCD Replacement",
        aliases: ["display panel", "inner screen"],
      },
      {
        id: "oled_replacement",
        label: "OLED / AMOLED Replacement",
        aliases: ["amoled", "super amoled", "dynamic amoled"],
      },
      {
        id: "touch_not_responding",
        label: "Touch Screen Not Responding",
        aliases: ["unresponsive touch", "digitizer", "touch dead"],
      },
      {
        id: "screen_burn_in",
        label: "Screen Burn-In",
        aliases: ["ghost image", "image retention", "burn in"],
      },
      {
        id: "dead_pixels",
        label: "Dead / Stuck Pixels",
        aliases: ["pixel", "dot on screen", "stuck pixel"],
      },
      {
        id: "screen_flickering",
        label: "Screen Flickering",
        aliases: ["flicker", "blinking screen", "screen flashing"],
      },
      {
        id: "display_lines",
        label: "Lines on Display",
        aliases: ["horizontal lines", "vertical lines", "stripe on screen"],
      },
      {
        id: "display_discolouration",
        label: "Display Discolouration",
        aliases: ["yellow tint", "green tint", "color issue", "tint"],
      },
      {
        id: "screen_dim",
        label: "Screen Too Dim / Brightness Issue",
        aliases: ["brightness", "dark screen", "low brightness"],
      },
      {
        id: "earpiece_mesh",
        label: "Earpiece Mesh Replacement",
        aliases: ["speaker mesh", "front speaker cover"],
      },
      {
        id: "proximity_sensor",
        label: "Proximity Sensor Repair",
        aliases: ["sensor", "screen stays on during call"],
      },
    ],
  },
  {
    id: "battery",
    label: "Battery",
    repairs: [
      {
        id: "battery_replacement",
        label: "Battery Replacement",
        aliases: ["new battery", "battery swap", "battery change"],
      },
      {
        id: "battery_draining_fast",
        label: "Battery Draining Fast",
        aliases: ["battery life", "poor battery", "quick drain"],
      },
      {
        id: "not_charging",
        label: "Phone Not Charging",
        aliases: ["won't charge", "no charge", "charging issue"],
      },
      {
        id: "slow_charging",
        label: "Slow Charging",
        aliases: ["charging slowly", "slow charge"],
      },
      {
        id: "overheating",
        label: "Overheating",
        aliases: ["phone hot", "heating up", "thermal"],
      },
      {
        id: "battery_swollen",
        label: "Swollen / Bloated Battery",
        aliases: ["bulging battery", "puffed battery", "swelled battery"],
      },
      {
        id: "wireless_charging",
        label: "Wireless Charging Not Working",
        aliases: ["qi charging", "inductive charging", "wireless"],
      },
    ],
  },
  {
    id: "charging_port",
    label: "Charging Port & Connectors",
    repairs: [
      {
        id: "charging_port_replacement",
        label: "Charging Port Replacement",
        aliases: ["usb port", "type-c port", "lightning port", "micro usb"],
      },
      {
        id: "charging_port_cleaning",
        label: "Charging Port Cleaning",
        aliases: ["lint in port", "dirty port", "clean charging port"],
      },
      {
        id: "headphone_jack",
        label: "Headphone Jack Repair",
        aliases: ["audio jack", "3.5mm jack", "aux port"],
      },
      {
        id: "sim_tray",
        label: "SIM Card Tray Replacement",
        aliases: ["sim slot", "sim holder", "sim ejector"],
      },
      {
        id: "sd_card_slot",
        label: "SD Card Slot Repair",
        aliases: ["memory card slot", "microsd slot"],
      },
    ],
  },
  {
    id: "camera",
    label: "Camera",
    repairs: [
      {
        id: "rear_camera_replacement",
        label: "Rear Camera Replacement",
        aliases: ["back camera", "main camera", "primary camera"],
      },
      {
        id: "front_camera_replacement",
        label: "Front Camera Replacement",
        aliases: ["selfie camera", "forward facing camera"],
      },
      {
        id: "camera_lens_replacement",
        label: "Camera Lens Replacement",
        aliases: ["cracked lens", "scratched lens", "camera glass"],
      },
      {
        id: "camera_not_focusing",
        label: "Camera Not Focusing",
        aliases: ["autofocus", "blurry camera", "focus issue"],
      },
      {
        id: "camera_black_screen",
        label: "Camera Shows Black Screen",
        aliases: ["camera not working", "camera blank"],
      },
      {
        id: "camera_lines",
        label: "Lines / Artifacts in Camera",
        aliases: ["camera distortion", "lines in photo"],
      },
      {
        id: "flash_repair",
        label: "Flash / Torch Not Working",
        aliases: ["flashlight", "led flash", "torch repair"],
      },
      {
        id: "periscope_camera",
        label: "Periscope / Telephoto Camera Repair",
        aliases: ["zoom lens", "telephoto", "optical zoom"],
      },
    ],
  },
  {
    id: "audio",
    label: "Audio & Sound",
    repairs: [
      {
        id: "earpiece_repair",
        label: "Earpiece Speaker Repair",
        aliases: [
          "call speaker",
          "top speaker",
          "ear speaker",
          "can't hear calls",
        ],
      },
      {
        id: "loudspeaker_repair",
        label: "Loudspeaker Repair",
        aliases: ["bottom speaker", "external speaker", "no sound"],
      },
      {
        id: "microphone_repair",
        label: "Microphone Repair",
        aliases: ["mic not working", "caller can't hear me", "muffled mic"],
      },
      {
        id: "second_microphone",
        label: "Secondary Microphone Repair",
        aliases: ["noise cancellation mic", "top mic"],
      },
      {
        id: "no_sound",
        label: "No Sound / Silent Phone",
        aliases: ["silent mode stuck", "no audio output"],
      },
      {
        id: "distorted_audio",
        label: "Distorted / Muffled Audio",
        aliases: ["buzzing sound", "crackling speaker", "audio quality"],
      },
    ],
  },
  {
    id: "buttons",
    label: "Buttons & Controls",
    repairs: [
      {
        id: "power_button",
        label: "Power Button Repair",
        aliases: [
          "on/off button",
          "sleep button",
          "side button",
          "wake button",
        ],
      },
      {
        id: "volume_buttons",
        label: "Volume Button Repair",
        aliases: ["volume up", "volume down", "volume key"],
      },
      {
        id: "mute_switch",
        label: "Mute / Silent Switch Repair",
        aliases: ["silent switch", "ringer switch", "mute toggle"],
      },
      {
        id: "home_button",
        label: "Home Button Repair",
        aliases: ["home key", "fingerprint sensor", "capacitive home"],
      },
      {
        id: "fingerprint_sensor_physical",
        label: "Fingerprint Sensor Repair",
        aliases: ["fingerprint reader", "biometric sensor", "touch id"],
      },
      {
        id: "face_id_repair",
        label: "Face ID / Face Recognition Repair",
        aliases: [
          "face unlock",
          "facial recognition",
          "face sensor",
          "dot projector",
        ],
      },
    ],
  },
  {
    id: "housing",
    label: "Housing & Frame",
    repairs: [
      {
        id: "back_glass_replacement",
        label: "Back Glass Replacement",
        aliases: ["rear glass", "back cover", "back panel cracked"],
      },
      {
        id: "back_cover_replacement",
        label: "Back Cover Replacement",
        aliases: ["battery cover", "rear panel", "plastic back"],
      },
      {
        id: "frame_replacement",
        label: "Frame / Chassis Replacement",
        aliases: ["mid frame", "housing", "bent frame", "chassis"],
      },
      {
        id: "frame_bend_repair",
        label: "Bent Frame Repair",
        aliases: ["bent phone", "warped chassis"],
      },
      {
        id: "antenna_repair",
        label: "Antenna Repair",
        aliases: [
          "signal issue",
          "no signal",
          "weak reception",
          "antenna band",
        ],
      },
      {
        id: "waterproofing_resealing",
        label: "Waterproofing Re-Sealing",
        aliases: ["ip rating repair", "water seal", "adhesive replacement"],
      },
    ],
  },
  {
    id: "connectivity",
    label: "Connectivity",
    repairs: [
      {
        id: "wifi_repair",
        label: "Wi-Fi Not Working",
        aliases: ["wifi issue", "no wifi", "wireless internet"],
      },
      {
        id: "bluetooth_repair",
        label: "Bluetooth Not Working",
        aliases: ["bluetooth issue", "bt not connecting"],
      },
      {
        id: "nfc_repair",
        label: "NFC Not Working",
        aliases: ["nfc issue", "contactless payment", "tap to pay"],
      },
      {
        id: "5g_antenna",
        label: "5G / 4G Signal Repair",
        aliases: [
          "no signal",
          "dropped calls",
          "cellular signal",
          "5g not working",
        ],
      },
      {
        id: "gps_repair",
        label: "GPS Not Working",
        aliases: ["location not working", "maps inaccurate", "gps fix"],
      },
      {
        id: "wifi_antenna",
        label: "Wi-Fi Antenna Replacement",
        aliases: ["wifi antenna", "wifi chip"],
      },
      {
        id: "esim_issue",
        label: "eSIM Issue",
        aliases: ["esim not activating", "esim repair", "digital sim"],
      },
    ],
  },
  {
    id: "software",
    label: "Software & System",
    repairs: [
      {
        id: "software_restore",
        label: "Software Restore / Reflash",
        aliases: ["factory reset", "reflash", "software fix", "os reinstall"],
      },
      {
        id: "bootloop",
        label: "Bootloop Fix",
        aliases: [
          "stuck on logo",
          "keeps restarting",
          "boot loop",
          "infinite reboot",
        ],
      },
      {
        id: "phone_not_turning_on",
        label: "Phone Not Turning On",
        aliases: ["dead phone", "won't turn on", "black screen of death"],
      },
      {
        id: "virus_malware",
        label: "Virus / Malware Removal",
        aliases: ["virus removal", "malware", "slow phone", "hacked"],
      },
      {
        id: "icloud_unlock",
        label: "iCloud Activation Lock Removal",
        aliases: ["icloud lock", "activation lock", "find my iphone lock"],
      },
      {
        id: "frp_bypass",
        label: "FRP / Google Account Lock Bypass",
        aliases: ["google lock", "frp lock", "factory reset protection"],
      },
      {
        id: "network_unlock",
        label: "Network / Carrier Unlock",
        aliases: ["sim unlock", "carrier unlock", "unlock phone"],
      },
      {
        id: "password_recovery",
        label: "Password / PIN Recovery",
        aliases: ["forgot password", "locked out", "pin bypass"],
      },
      {
        id: "data_recovery",
        label: "Data Recovery",
        aliases: ["recover photos", "deleted files", "data loss"],
      },
      {
        id: "data_transfer",
        label: "Data Transfer",
        aliases: ["backup restore", "phone migration", "move data"],
      },
      {
        id: "software_update",
        label: "Software Update",
        aliases: ["os update", "firmware update", "system update"],
      },
      {
        id: "app_issue",
        label: "App / Performance Issue",
        aliases: ["apps crashing", "slow phone", "lagging", "freezing"],
      },
      {
        id: "imei_issue",
        label: "IMEI Issue",
        aliases: ["no imei", "imei null", "invalid imei"],
      },
    ],
  },
  {
    id: "foldable",
    label: "Foldable Phone (Specific)",
    repairs: [
      {
        id: "inner_screen_fold",
        label: "Inner Foldable Screen Replacement",
        aliases: ["fold screen", "inner display", "main display fold"],
      },
      {
        id: "hinge_repair",
        label: "Hinge Repair",
        aliases: ["fold hinge", "hinge broken", "flex hinge", "crease"],
      },
      {
        id: "hinge_replacement",
        label: "Hinge Replacement",
        aliases: ["new hinge", "hinge swap"],
      },
      {
        id: "fold_crease",
        label: "Crease / Fold Mark",
        aliases: ["screen crease", "fold line", "middle crease"],
      },
      {
        id: "cover_screen_fold",
        label: "Cover Screen Replacement",
        aliases: ["outer screen", "external display", "cover display"],
      },
      {
        id: "uthin_layer",
        label: "UTG / Ultra-Thin Glass Repair",
        aliases: ["utg", "ultra thin glass", "protective film"],
      },
    ],
  },
  {
    id: "liquid_damage",
    label: "Liquid & Physical Damage",
    repairs: [
      {
        id: "liquid_damage_treatment",
        label: "Liquid Damage Treatment",
        aliases: ["water damage", "dropped in water", "wet phone", "moisture"],
      },
      {
        id: "corrosion_cleaning",
        label: "Corrosion Cleaning",
        aliases: ["corroded board", "rust", "oxidation", "green corrosion"],
      },
      {
        id: "physical_damage_assessment",
        label: "Physical Damage Assessment",
        aliases: ["dropped phone", "impact damage", "cracked body"],
      },
    ],
  },
  {
    id: "other",
    label: "Other",
    repairs: [
      {
        id: "vibration_motor",
        label: "Vibration Motor Repair",
        aliases: [
          "haptic motor",
          "vibrate not working",
          "taptic engine",
          "no vibration",
        ],
      },
      {
        id: "biometric_repair",
        label: "Under-Display Fingerprint Repair",
        aliases: [
          "in-display fingerprint",
          "optical fingerprint",
          "ultrasonic fingerprint",
        ],
      },
      {
        id: "stylus_repair",
        label: "S Pen / Stylus Repair",
        aliases: ["s pen", "stylus broken", "pen not working"],
      },
      {
        id: "signal_booster",
        label: "Signal Booster / Antenna Strip",
        aliases: ["flex antenna", "internal antenna strip"],
      },
      {
        id: "earpiece_mesh_clean",
        label: "Speaker / Earpiece Mesh Cleaning",
        aliases: ["clogged speaker", "blocked earpiece", "mesh clean"],
      },
      {
        id: "diagnostic",
        label: "Full Diagnostic",
        aliases: ["check phone", "device check", "inspection", "health check"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Flat list — convenient for simple autocomplete (id + label + aliases merged)
// ─────────────────────────────────────────────────────────────────────────────

export type FlatRepair = Repair & { categoryId: string; categoryLabel: string };

export const repairsFlatList: FlatRepair[] = repairCatalog.flatMap((category) =>
  category.repairs.map((repair) => ({
    ...repair,
    categoryId: category.id,
    categoryLabel: category.label,
  })),
);

export default repairCatalog;
