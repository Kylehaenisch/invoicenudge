"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * A submit button for a server-action <form> that asks for confirmation
 * before the browser submits it. This is the only client/server boundary
 * needed — the surrounding <form action={serverAction}> stays a plain
 * Server Component child.
 */
export function ConfirmSubmitButton({
  confirmMessage,
  children,
  ...props
}: ButtonProps & { confirmMessage: string }) {
  return (
    <Button
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
