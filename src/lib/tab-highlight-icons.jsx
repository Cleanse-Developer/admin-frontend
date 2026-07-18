/**
 * Registry of product "tab highlight" icons for the admin editor's icon picker.
 *
 * This mirrors the storefront registry at
 * `frontend/src/lib/tab-highlight-icons.jsx` — SAME keys, SAME react-icons
 * components — so the picker offers and previews exactly what the store renders.
 * The two apps are not a shared workspace, so keep this file in sync with the
 * storefront one when adding icons.
 */
import {
  GiBerryBush,
  GiDaisy,
  GiThreeLeaves,
  GiHerbsBundle,
  GiVineLeaf,
  GiAgave,
  GiLotus,
  GiVineFlower,
} from "react-icons/gi";
import {
  FaSeedling,
  FaDroplet,
  FaLeaf,
  FaPaw,
  FaFlask,
  FaHandsBubbles,
  FaHandHoldingDroplet,
  FaHandsHolding,
  FaHandSparkles,
  FaMoon,
  FaArrowsRotate,
  FaTruckFast,
  FaClock,
  FaBolt,
  FaEarthAmericas,
  FaRotateLeft,
  FaShieldHalved,
  FaCertificate,
  FaCalendarDays,
  FaSun,
  FaVial,
  FaHand,
  FaCircleCheck,
} from "react-icons/fa6";

// key -> react-icons component.
export const TAB_HIGHLIGHT_ICON_COMPONENTS = {
  amla: GiBerryBush,
  bhringraj: GiDaisy,
  neem: GiThreeLeaves,
  tulsi: GiHerbsBundle,
  brahmi: GiVineLeaf,
  aloe: GiAgave,
  saffron: GiVineFlower,
  lotus: GiLotus,
  plant: FaSeedling,
  dropper: FaDroplet,
  leaf: FaLeaf,
  noparaben: FaDroplet,
  chemical: FaFlask,
  paw: FaPaw,
  check: FaCircleCheck,
  shield: FaShieldHalved,
  certificate: FaCertificate,
  wash: FaHandsBubbles,
  drops: FaHandHoldingDroplet,
  hands: FaHandsHolding,
  massage: FaHandSparkles,
  moon: FaMoon,
  repeat: FaArrowsRotate,
  sun: FaSun,
  calendar: FaCalendarDays,
  test: FaVial,
  external: FaHand,
  truck: FaTruckFast,
  clock: FaClock,
  express: FaBolt,
  globe: FaEarthAmericas,
  returnbox: FaRotateLeft,
};

// Ordered catalog for the picker grid, grouped by the tab it usually belongs to.
export const TAB_HIGHLIGHT_ICON_LIST = [
  { id: "amla", label: "Amla", category: "ingredients" },
  { id: "bhringraj", label: "Bhringraj", category: "ingredients" },
  { id: "neem", label: "Neem", category: "ingredients" },
  { id: "tulsi", label: "Tulsi", category: "ingredients" },
  { id: "brahmi", label: "Brahmi", category: "ingredients" },
  { id: "aloe", label: "Aloe Vera", category: "ingredients" },
  { id: "saffron", label: "Saffron", category: "ingredients" },
  { id: "lotus", label: "Lotus", category: "ingredients" },
  { id: "plant", label: "Plant / Leaf", category: "ingredients" },
  { id: "dropper", label: "Dropper", category: "ingredients" },
  { id: "leaf", label: "Leaf", category: "ingredients" },
  { id: "noparaben", label: "No Paraben", category: "ingredients" },
  { id: "chemical", label: "No Chemical", category: "ingredients" },
  { id: "paw", label: "Cruelty Free", category: "values" },
  { id: "check", label: "Check / Quality", category: "values" },
  { id: "shield", label: "Shield / Protection", category: "values" },
  { id: "certificate", label: "Certificate", category: "values" },
  { id: "wash", label: "Wash / Cleanse", category: "howToUse" },
  { id: "drops", label: "Drops", category: "howToUse" },
  { id: "hands", label: "Hands / Warm", category: "howToUse" },
  { id: "massage", label: "Massage", category: "howToUse" },
  { id: "moon", label: "Moon / Night", category: "howToUse" },
  { id: "repeat", label: "Repeat / Cycle", category: "howToUse" },
  { id: "sun", label: "Sun / Store", category: "policies" },
  { id: "calendar", label: "Calendar / Shelf Life", category: "policies" },
  { id: "test", label: "Test / Patch Test", category: "policies" },
  { id: "external", label: "External Use", category: "policies" },
  { id: "truck", label: "Truck / Shipping", category: "shipping" },
  { id: "clock", label: "Clock / Time", category: "shipping" },
  { id: "express", label: "Express / Fast", category: "shipping" },
  { id: "globe", label: "Globe / Worldwide", category: "shipping" },
  { id: "returnbox", label: "Return Box", category: "shipping" },
];

// Returns the icon element for a key, or null if unknown.
export function renderTabHighlightIcon(key, props) {
  const Comp = TAB_HIGHLIGHT_ICON_COMPONENTS[key];
  return Comp ? <Comp {...props} /> : null;
}
