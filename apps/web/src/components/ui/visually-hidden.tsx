import * as ReactVisuallyHidden from "@radix-ui/react-visually-hidden";

export const VisuallyHidden = ({ children }: { children: React.ReactNode }) => {
  return <ReactVisuallyHidden.Root>{children} </ReactVisuallyHidden.Root>;
};
