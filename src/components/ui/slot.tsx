"use client";

import * as React from "react";

/**
 * This is a simplified version of the Slot component from @radix-ui/react-slot
 * It allows you to pass a component as a child and have it receive the props
 * from the Slot component.
 */
const Slot = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }
>(({ children, ...props }, ref) => {
  if (!React.isValidElement(children)) {
    return null;
  }

  return React.cloneElement(children, {
    ...props,
    ref,
  });
});
Slot.displayName = "Slot";

export { Slot };
