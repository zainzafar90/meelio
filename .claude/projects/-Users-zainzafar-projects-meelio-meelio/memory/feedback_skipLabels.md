---
name: Don't add filtering props for single-use components
description: Build the right data at the source instead of passing filter/skip props to components used in one place
type: feedback
---

Don't add filtering props (like `skipLabels`) to components that are only used in one place. If a component needs different data, build the right data at the call site — don't pass the wrong data and then filter it.

**Why:** It's over-engineered abstraction for zero reuse. The user called this out as not thinking before making changes.

**How to apply:** When a component is used in exactly one place, shape the data before passing it in. Only add filtering/configuration props when there are multiple consumers with genuinely different needs.
