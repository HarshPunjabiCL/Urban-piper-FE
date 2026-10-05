/**
 * Turn an API field path into the place on screen where it is edited.
 *
 * Validation messages arrive naming UrbanPiper's fields — `platform_data[0].name`,
 * `items[2].food_type`. Correct, and useless to whoever is filling the form:
 * nothing on screen is called that. This maps each path to the section heading
 * and field label the operator is actually looking at.
 *
 * Unknown paths fall through to the raw path rather than guessing, so a new
 * field shows something true rather than something invented.
 */

/** Store fields (step 1). Section names match the headings in StoreForm. */
const STORE = {
  ref_id: ["Identity", "Outlet ID"],
  name: ["Identity", "Outlet name"],
  address: ["Location", "Address"],
  city: ["Location", "City"],
  geo_latitude: ["Location", "Latitude"],
  geo_longitude: ["Location", "Longitude"],
  zip_codes: ["Location", "Zip codes"],
  contact_phone: ["Contact & notifications", "Contact phone"],
  notification_phones: ["Contact & notifications", "Notification phones"],
  notification_emails: ["Contact & notifications", "Notification emails"],
  min_order_value: ["Ordering", "Min order value"],
  min_delivery_time: ["Ordering", "Min delivery time"],
  min_pickup_time: ["Ordering", "Min pickup time"],
  ordering_enabled: ["Ordering", "Online ordering enabled"],
  active: ["Ordering", "Outlet active"],
  hide_from_ui: ["Ordering", "Hide from UI"],
  timings: ["Operating hours", "the day and time rows"],
  platform_data: ["Channel mapping", "the channel rows"],
  excluded_platforms: ["Channel mapping", "Excluded platforms"]
};

/** Sub-fields of a repeated store row, e.g. platform_data[0].name. */
const STORE_NESTED = {
  "platform_data.name": ["Channel mapping", "Channel"],
  "platform_data.platform_store_id": ["Channel mapping", "Platform store ID"],
  "platform_data.url": ["Channel mapping", "URL"],
  "timings.day": ["Operating hours", "the day"],
  "timings.slots.start_time": ["Operating hours", "the start time"],
  "timings.slots.end_time": ["Operating hours", "the end time"]
};

/** Catalogue entities (step 2). The first value is the tab they live on. */
const CATALOGUE_TAB = {
  categories: "Categories",
  items: "Items",
  option_groups: "Modifiers",
  options: "Modifiers",
  taxes: "Taxes & charges",
  charges: "Taxes & charges"
};

const CATALOGUE_FIELD = {
  ref_id: "ref_id",
  code: "Charge type",
  title: "Title",
  name: "Name",
  price: "Price",
  structure: "Value",
  "structure.value": "Value",
  food_type: "the dietary dropdown",
  category_ref_ids: "Category ref ids",
  item_ref_ids: "Attached to items",
  opt_grp_ref_ids: "In groups",
  included_platforms: "Included platforms",
  fulfillment_modes: "Fulfilment modes",
  min_selectable: "Min select",
  max_selectable: "Max select",
  location_ref_ids: "Location ref ids",
  clear_items: "Clear items",
  clear_locations: "Clear locations"
};

const ORDINAL = ["first", "second", "third", "fourth", "fifth"];
const nth = (i) => ORDINAL[i] ?? `${i + 1}th`;

/**
 * @returns {{where: string, what: string} | null}
 *   `where` = the section or tab to look in, `what` = the field there.
 *   null when the path is not recognised; show the raw path instead.
 */
export function locateField(path) {
  if (typeof path !== "string" || path === "") return null;

  // items[2].food_type  ->  entity "items", index 2, field "food_type"
  const listed = path.match(/^([a-z_]+)\[(\d+)\]\.?(.*)$/);
  if (listed) {
    const [, entity, indexText, rest] = listed;
    const index = Number(indexText);

    if (CATALOGUE_TAB[entity]) {
      const field = CATALOGUE_FIELD[rest] ?? rest ?? "";
      return {
        where: `Send the menu → ${CATALOGUE_TAB[entity]} tab, ${nth(index)} row`,
        what: field
      };
    }

    // A repeated store row: platform_data[0].name, timings[1].slots[0].start_time
    const key = `${entity}.${rest.replace(/\[\d+\]/g, "")}`;
    const nested = STORE_NESTED[key];
    if (nested) {
      return { where: `Register the outlet → ${nested[0]}, ${nth(index)} row`, what: nested[1] };
    }
    if (STORE[entity]) {
      return { where: `Register the outlet → ${STORE[entity][0]}`, what: `${STORE[entity][1]}, ${nth(index)} row` };
    }
    return null;
  }

  const store = STORE[path];
  if (store) return { where: `Register the outlet → ${store[0]}`, what: store[1] };

  return null;
}
