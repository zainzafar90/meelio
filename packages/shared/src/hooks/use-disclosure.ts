import * as React from "react";

/**
 * This hook is used to manage the state of a componets to show or hide
 * a content like a modal, dropdown, etc.
 *
 * Usage:
 * const { isOpen, open, close, toggle } = useDisclosure();
 *
 * <Dialog isOpen={isOpen} onClose={close}>
 *
 * @param initial initial state of the disclosure @default false
 * @returns isOpen, open, close, toggle
 */
export const useDisclosure = (initial = false) => {
  const [isOpen, setIsOpen] = React.useState(initial);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((state) => !state), []);

  return { isOpen, open, close, toggle };
};
