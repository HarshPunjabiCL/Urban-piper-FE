# Menu builder field guide

What each box on the **Send the menu** step means, what to type in it, and the
UrbanPiper API field it becomes. Written for someone opening this screen for
the first time.

The same worked example runs through every section:

| Thing | ID | Shown to customer as |
|---|---|---|
| Category | `ITALLIAN` | Italian |
| Item | `PIZZA-123` | Onion Pizza, 340 |
| Modifier group (question) | `PIZZA-SIZE` | Choose your size |
| Variant (answer) | `PIZZA-REG` | Regular, +0 |
| Variant (answer) | `PIZZA-LARGE` | Large, +150 |

## The one rule: IDs are the glue

Every tab has an **ID** box. Customers never see IDs. Some ID boxes **define**
a code (Category ID, Item ID, Group ID) and other boxes **point at** one
(Category ID(s) on an item, Applies to items, Belongs to group(s)). A
pointing box must contain exactly the text of a defining box, same spelling
and case, or the two are not linked.

```
Categories tab      Items tab                 Modifiers tab
--------------      ---------                 -------------
Category ID  <----  Category ID(s)
                    Item ID         <-------  Modifier group: Applies to items
                                              Group ID  <----  Variant: Belongs to group(s)
```

Fill the tabs in this order: **Categories, Items, Modifiers, Taxes & charges.**
The push is checked before it is sent. A variant that names a group that does
not exist, or a group that names an item that does not exist, stops the push
and names the exact box.

---

## Categories tab

A category is a heading on the Swiggy / Zomato menu.

| Box | What to type | Example | API field |
|---|---|---|---|
| Category ID * | The code items point at. Each item's Category ID(s) box must contain exactly this. | `ITALLIAN` | `categories[].ref_id` |
| Category name * | The heading customers read. | `Italian` | `categories[].name` |
| Display order | Position on the menu. Lower shows first. | `1` | `categories[].sort_order` |
| Parent category ID | Only for a sub-category: the Category ID it sits under. Blank for a top-level heading. | blank | `categories[].parent_ref_id` |
| Description | Optional line under the heading. | blank | `categories[].description` |

Category timings (breakfast menu only until 11:00, for example) are set in the
separate **Category timings** panel below the menu builder, not here.

---

## Items tab

One row is one dish.

| Box | What to type | Example | API field |
|---|---|---|---|
| Item ID / SKU * | Your POS code for the dish. Orders from Swiggy / Zomato arrive carrying this ID, so it **must** be the code the POS uses. | `PIZZA-123` | `items[].ref_id` |
| Item name * | Name customers see. | `Onion Pizza` | `items[].title` |
| Price (Rs) * | Base price before any variant or modifier is added. | `340` | `items[].price` |
| Category ID(s) * | Category ID from the Categories tab. Comma-separate to list under several headings. | `ITALLIAN` | `items[].category_ref_ids` |
| Veg / non-veg * | Dietary mark next to the item. | Veg | `items[].food_type` (`1` veg, `2` non-veg, `3` egg, `5` not applicable) |
| Aggregator price (Rs) | Price on Swiggy / Zomato when it differs from the base. Blank uses Price. | blank | `items[].external_price` |
| Description | Customer-facing text under the name. | blank | `items[].description` |
| Item tags | Per-channel tags such as Bestseller. Channel list comes from the account. | | `items[].tags` |
| Nutritional info | Calories, protein, fat, etc. Goes to the Atlas Nutritional Info tab. Sent exactly as typed, no unit conversion. | `73` kcal | `items[].key_value_groups` |
| Allergens | Tick boxes. Written into the description as a `Contains:` line. | Milk | `items[].description` |
| More fields | Images, per-channel price, weight, serves, strike-through price, stock, internal name, sold at store, fulfilment modes. | | see `ItemExtras.jsx` |
| Available | Untick to hide the item without deleting it. | ticked | `items[].available` |
| Recommended | Marks the item as recommended on the app. | | `items[].recommended` |

---

## Modifiers tab

UrbanPiper has no "variant" or "modifier" entity. It has **option groups**
(a question) and **options** (the answers). This screen calls them **Modifier
groups** and **Variants / modifiers**, matching the POS spec: section 8 calls
Small / Large a Variant, section 9 calls Cheese / Olives a Modifier inside a
Modifier Group. UrbanPiper stores both the same way.

A modifier group carries **no price**. Every variant / modifier carries its own
extra amount, added on top of the item price. A free add-on is priced 0.

### Modifier groups (the question)

| Box | What to type | Example | API field |
|---|---|---|---|
| Group ID * | The code variants point at. Each variant's Belongs to group(s) box must contain exactly this. | `PIZZA-SIZE` | `option_groups[].ref_id` |
| Group name * | The question customers see. | `Choose your size` | `option_groups[].title` |
| Type * | Sets Min and Max for you. See table below. | Variant, pick exactly one | derived |
| Min picks | Fewest answers a customer must pick. `0` = optional. | `1` | `option_groups[].min_selectable` |
| Max picks | Most answers a customer may pick. `-1` = no limit. | `1` | `option_groups[].max_selectable` |
| Applies to items * | Item ID(s) that ask this question. Comma-separate for several. | `PIZZA-123` | `option_groups[].item_ref_ids` |
| Display order | Order of questions on the item. Lower first. | `1` | `option_groups[].sort_order` |
| Active | Untick to hide the whole question without deleting it. | ticked | `option_groups[].active` |
| Same variant more than once | Lets a customer add the same variant several times, e.g. 2 x extra cheese. | unticked | `option_groups[].multi_options_enabled` |

**Type** is a convenience. UrbanPiper only knows Min and Max.

| Type | Min | Max | Use for |
|---|---|---|---|
| Variant | 1 | 1 | Size, crust, portion. Atlas shows it as "Variant Group". |
| Modifier / add-on | 0 | -1 | Toppings, extras. Atlas shows it as "Add-On Group". -1 means no limit. |
| Custom | you set | you set | Depends on the menu, e.g. "pick at least one sauce" is min 1, max -1 |

### Modifier / variant (the answers)

| Box | What to type | Example | API field |
|---|---|---|---|
| Variant ID * | Any unique code. Nothing else refers to it. | `PIZZA-LARGE` | `options[].ref_id` |
| Variant name * | The answer customers see. | `Large` | `options[].title` |
| Price (Rs, added to item) * | Extra amount on top of the item price. `0` = free. | `150` | `options[].price` |
| Belongs to group(s) * | Group ID(s) this answers. Comma-separate to reuse under several questions. | `PIZZA-SIZE` | `options[].opt_grp_ref_ids` |
| Description | Optional. | blank | `options[].description` |
| Display order | Order within the question. Lower first. | `1` | `options[].sort_order` |
| Type (veg / non-veg) | Dietary mark on the variant. | Veg | `options[].food_type` |
| Available | Untick to hide the variant. | ticked | `options[].available` |
| Recommended | Highlights the variant on the app. | unticked | `options[].recommended` |

### POS spec fields with no UrbanPiper equivalent

From sections 8 and 9 of the requirements document. These stay in the POS and
appear in the drop report if sent.

| POS field | Why it cannot be sent |
|---|---|
| Variant / modifier tax | UrbanPiper taxes attach to items only |
| MRP on a variant | No MRP field on options |
| Default variant / default selection | No default flag on options |
| Variant / modifier timing | Timing exists only at category level |
| Special price on a variant | One price per option; per-channel price exists on items only |

### Worked example, end to end

```
Items tab
  Item ID PIZZA-123, name Onion Pizza, price 340, Category ID(s) ITALLIAN

Modifiers tab, Modifier groups
  Group ID PIZZA-SIZE, name "Choose your size",
  Type "Variant", Applies to items PIZZA-123

Modifiers tab, Modifier / variant
  Variant ID PIZZA-REG,   name Regular, price 0,   Belongs to group PIZZA-SIZE
  Variant ID PIZZA-LARGE, name Large,   price 150, Belongs to group PIZZA-SIZE
```

On the app: Onion Pizza under Italian at 340. The customer must pick a size.
Regular keeps it at 340, Large makes it 490.

To add optional toppings: a second group `PIZZA-TOPPINGS`, name "Add
toppings", Type "Modifier / add-on", applies to `PIZZA-123`. Then modifiers
`TOP-CHEESE` at 40 and `TOP-OLIVES` at 30, both belonging to `PIZZA-TOPPINGS`.

---

## Taxes & charges tab

### Taxes

A tax is a percentage on the item price. CGST and SGST are **two separate
rows**. UrbanPiper validates both the code and the name.

| Box | What to type | Example | API field |
|---|---|---|---|
| Tax code * | Exactly one of `CGST_P`, `SGST_P`, `IGST_P`, `VAT_P`. Anything else is rejected. | `CGST_P` | `taxes[].code` |
| Tax name * | Must contain GST, CGST, SGST, VAT, Municipality or Kerala as a separate word. | `CGST` | `taxes[].title` |
| Rate % | Percentage of the item price. | `2.5` | `taxes[].structure.value` |
| Applies to items * | `all` for every item, or Item IDs comma-separated. | `all` | `taxes[].item_ref_ids` |

### Charges

A charge is a packaging or delivery fee. Service charges do not exist in
UrbanPiper and are rejected.

| Box | What to type | Example | API field |
|---|---|---|---|
| Charge type * | Packaging or Delivery, each as fixed rupees or a percentage. | Packaging, fixed | `charges[].code` (`PC_F`, `PC_P`, `DC_F`, `DC_P`) |
| Charge name * | Name shown on the bill. | `Packaging` | `charges[].title` |
| Amount / Percentage | Rupees for a fixed charge, percent for a percentage charge. The label changes with the type. | `20` | `charges[].structure.value` |
| Applicable on | Blank charges once per order. `item.quantity` charges per unit ordered. | blank | `charges[].structure.applicable_on` |

---

## Sync mode

Every push is a **full sync**. The editor is the complete snapshot of the
menu. Anything not listed is deleted from that outlet on UrbanPiper's side.

On an **outlet** push (for example `KN- Group`) this replaces items and
variants only. Categories, modifier groups, taxes and charges are only replaced on a
**master-level** push (location `-1`).

---

## Where the rules live in code

| Concern | File |
|---|---|
| Every field above, its label and hint | `components/MenuBuilder.jsx`, `components/ItemExtras.jsx` |
| Which fields UrbanPiper accepts, closed enums, validation, ID cross-checks | `backend/src/schema/catalogue.js` |
| Fields the POS has that UrbanPiper cannot take, with the reason | `backend/src/schema/unsupported.js` |
| Mapping an API error path back to a box on screen | `lib/fieldLabels.js` |
