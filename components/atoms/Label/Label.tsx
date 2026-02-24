import { cn } from "@/utils/cn";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: React.ReactNode;
}

export default function Label({
  required = false,
  children,
  className,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn("text-sm font-medium text-text-primary", className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}
